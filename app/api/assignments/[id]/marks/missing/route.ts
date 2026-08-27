import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { handleError } from "@/app/utils/errors.utility";
import { toStudentSummary } from "@/app/api/students/responses";
import { submissionListQuerySchema, parseAssignmentRouteId } from "../../../schemas";
import { getMissingSubmissions } from "../../../services/assignments.services";

/**
 * @swagger
 * /api/assignments/{id}/marks/missing:
 *   get:
 *     tags: [Assignments]
 *     summary: List students who did not submit the assignment
 *     description: Returns students in the assignment class with no submission record
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment id
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
 *         description: Assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request, _body, context) => {
  try {
    const { id } = await context.params;
    const assignmentId = parseAssignmentRouteId(id);
    const queryParams = request.nextUrl.searchParams;
    const parsed = submissionListQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await getMissingSubmissions(assignmentId, parsed.data);
    return NextResponse.json({
      data: result.data.map(toStudentSummary),
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
});
