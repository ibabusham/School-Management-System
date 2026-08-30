import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { getTakenSubmissions } from "../../../services/exams.services";
import { toTakenSubmissionSummary } from "../../../responses";
import { submissionListQuerySchema } from "../../../schemas";
import { assertTeacherOrAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { requireTeacherOwnsExam } from "@/app/api/auth/services/teacher-scope";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/exams/{id}/marks/taken:
 *   get:
 *     tags: [Exams]
 *     summary: List students who took the exam
 *     description: Returns students with exam submissions and their marks
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
 *         description: Paginated list of exam submissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamSubmissionListResponse'
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
 *       403:
 *         description: Forbidden — insufficient role or out-of-scope access
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
    // RBAC: teacher must own the exam's subject to view submissions
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

    const result = await getTakenSubmissions(id, parsed.data);
    return NextResponse.json({
      data: result.data.map(toTakenSubmissionSummary),
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
});
