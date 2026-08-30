import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { markExam } from "../../services/exams.services";
import {
  buildMarkPagination,
  EXAM_MARKED_MESSAGE,
  toMarkSubmissionSummary,
} from "../../responses";
import { bulkMarkExamSchema } from "../../schemas";
import { assertTeacherOrAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { requireTeacherOwnsExam } from "@/app/api/auth/services/teacher-scope";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/exams/{id}/marks:
 *   post:
 *     tags: [Exams]
 *     summary: Mark exam submissions
 *     description: Create or update marks for one or more students on an exam
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkMarkExamRequest'
 *           example:
 *             marks:
 *               - studentId: "00000000-0000-4000-8000-000000000002"
 *                 score: 85
 *     responses:
 *       200:
 *         description: Marks saved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarkExamResponse'
 *       400:
 *         description: Validation error or score exceeds maximum grade
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
 *         description: Exam or student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(
  bulkMarkExamSchema,
  async (request, body, context) => {
    try {
      const auth = await getAuthPayload(request);
      const { id } = await context.params;
      // RBAC: only teacher who owns the exam's subject (or admin) may mark
      assertTeacherOrAdmin(auth);
      await requireTeacherOwnsExam(auth, id);

      const result = await markExam(id, body);
      const data = result.submissions.map(toMarkSubmissionSummary);
      return NextResponse.json({
        message: EXAM_MARKED_MESSAGE,
        data,
        pagination: buildMarkPagination(data.length),
      });
    } catch (error) {
      return handleError(error);
    }
  }
);
