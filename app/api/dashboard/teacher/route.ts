import { NextResponse } from "next/server";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { handleError } from "@/app/utils/errors.utility";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { getSubjectList } from "@/app/api/subjects/Services/subjects.services";
import { toSubjectSummary } from "@/app/api/subjects/responses";
import { getExamList } from "@/app/api/exams/services/exams.services";
import { toExamSummary } from "@/app/api/exams/responses";
import { getAssignmentList } from "@/app/api/assignments/services/assignments.services";
import { toAssignmentSummary } from "@/app/api/assignments/responses";

/**
 * @swagger
 * /api/dashboard/teacher:
 *   get:
 *     tags: [Dashboard]
 *     summary: Teacher dashboard snapshot
 *     description: Returns the teacher's subject, exam, and assignment counts plus recent items in one request.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher dashboard payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherDashboardResponse'
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

    const [subjects, exams, assignments] = await Promise.all([
      getSubjectList({ page: 1, limit: 5 }, auth),
      getExamList({ page: 1, limit: 5 }, auth),
      getAssignmentList({ page: 1, limit: 5 }, auth),
    ]);

    return NextResponse.json({
      counts: {
        subjects: subjects.pagination.total,
        exams: exams.pagination.total,
        assignments: assignments.pagination.total,
      },
      subjects: subjects.data.map(toSubjectSummary),
      recentExams: exams.data.map(toExamSummary),
      recentAssignments: assignments.data.map(toAssignmentSummary),
    });
  } catch (error) {
    return handleError(error);
  }
});
