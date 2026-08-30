import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { getMissingSubmissions } from "../../../services/exams.services";
import { submissionListQuerySchema } from "../../../schemas";
import { assertTeacherOrAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { requireTeacherOwnsExam } from "@/app/api/auth/services/teacher-scope";
import { handleError } from "@/app/utils/errors.utility";
import { toStudentSummary } from "@/app/api/students/responses";

/**
 * @swagger
 * /api/exams/{id}/marks/missing:
 *   get:
 *     tags: [Exams]
 *     summary: List students who did not take the exam
 *     description: Returns students in the exam class with no submission record
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exam id
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of students without submissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentListResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Exam not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    const { id } = await context.params;
    // RBAC: teacher must own the exam's subject to view missing submissions
    assertTeacherOrAdmin(auth);
    await requireTeacherOwnsExam(auth, id);

    const queryParams = request.nextUrl.searchParams;
    const parsed = submissionListQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await getMissingSubmissions(id, parsed.data);
    return NextResponse.json({
      data: result.data.map(toStudentSummary),
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
});
