import { NextResponse } from "next/server";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { handleError } from "@/app/utils/errors.utility";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { getLearningProgress } from "@/app/api/students/[id]/learningProgress/services/learningProgress.services";
import {
  toLearningProgress,
  toProgressNote,
} from "@/app/api/students/[id]/learningProgress/responses";

/**
 * @swagger
 * /api/dashboard/student:
 *   get:
 *     tags: [Dashboard]
 *     summary: Student dashboard snapshot
 *     description: Returns the student's learning progress (with per-subject averages) and latest teacher notes in one request.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentDashboardResponse'
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
 */
export const GET = createRouteHandler(null, async (request) => {
  try {
    const auth = await getAuthPayload(request);

    const result = await getLearningProgress(
      auth.sub,
      { page: 1, limit: 3 },
      auth
    );

    return NextResponse.json({
      learningProgress: toLearningProgress(
        result.learningProgress,
        result.progressNotes,
        result.subjectAverages
      ),
      recentNotes: result.progressNotes.map(toProgressNote),
    });
  } catch (error) {
    return handleError(error);
  }
});
