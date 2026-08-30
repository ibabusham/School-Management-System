import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { handleError } from "@/app/utils/errors.utility";
import { bulkMarkAssignmentSchema, parseAssignmentRouteId } from "../../schemas";
import { markAssignment } from "../../services/assignments.services";
import {
  ASSIGNMENT_MARKED_MESSAGE,
  buildMarkPagination,
  toMarkSubmissionSummary,
} from "../../responses";
import { assertTeacherOrAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { requireTeacherOwnsAssignment } from "@/app/api/auth/services/teacher-scope";

/**
 * @swagger
 * /api/assignments/{id}/marks:
 *   post:
 *     tags: [Assignments]
 *     summary: Mark assignment submissions
 *     description: Create or update marks for one or more students on an assignment
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkMarkAssignmentRequest'
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
 *               $ref: '#/components/schemas/MarkAssignmentResponse'
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
 *       403:
 *         description: Forbidden — insufficient role or out-of-scope access
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Assignment or student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(
  bulkMarkAssignmentSchema,
  async (request, body, context) => {
    try {
      const auth = await getAuthPayload(request);
      const { id } = await context.params;
      const assignmentId = parseAssignmentRouteId(id);
      // RBAC: only teacher who owns the assignment's subject (or admin) may mark
      assertTeacherOrAdmin(auth);
      await requireTeacherOwnsAssignment(auth, assignmentId);

      const result = await markAssignment(assignmentId, body);
      const data = result.submissions.map(toMarkSubmissionSummary);
      return NextResponse.json({
        message: ASSIGNMENT_MARKED_MESSAGE,
        data,
        pagination: buildMarkPagination(data.length),
      });
    } catch (error) {
      return handleError(error);
    }
  }
);
