import { NextResponse } from "next/server";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { handleError } from "@/app/utils/errors.utility";
import {
  assertStudentAccess,
  getAuthPayload,
} from "@/app/api/auth/services/requireAuth";
import { learningProgressNotesQuerySchema } from "./schemas";
import { getLearningProgress } from "./services/learningProgress.services";
import { toLearningProgress } from "./responses";

/**
 * @swagger
 * /api/students/{id}/learningProgress:
 *   get:
 *     tags: [Students]
 *     summary: Get student learning progress report
 *     description: Returns cached learning metrics and paginated progress notes for a student
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student id (User id)
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
 *         description: Learning progress report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LearningProgressReportResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Student or learning progress not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    const { id } = await context.params;
    assertStudentAccess(auth, id);

    const queryParams = request.nextUrl.searchParams;
    const parsed = learningProgressNotesQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await getLearningProgress(id, parsed.data);

    return NextResponse.json({
      learningProgress: toLearningProgress(result.learningProgress, result.progressNotes),
      notesPagination: result.notesPagination,
    });
  } catch (error) {
    return handleError(error);
  }
});
