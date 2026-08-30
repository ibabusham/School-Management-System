import { NextResponse } from "next/server";
import { assignStudentsToClass } from "../../Services/classes.services";
import { assignStudentsSchema } from "../../schemas";
import {
  STUDENTS_ASSIGNED_MESSAGE,
  toAssignedStudentSummary,
} from "../../responses";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/classes/{id}/students:
 *   post:
 *     tags: [Classes]
 *     summary: Assign students to class
 *     description: Assign one or more students to a class by setting their classId
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignStudentsRequest'
 *     responses:
 *       200:
 *         description: Students assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignStudentsResponse'
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
 *         description: Class or student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(
  assignStudentsSchema,
  async (request, body, context) => {
    try {
      const auth = await getAuthPayload(request);

      const { id } = await context.params;
      const result = await assignStudentsToClass(id, body.studentIds);
      return NextResponse.json({
        message: STUDENTS_ASSIGNED_MESSAGE,
        classId: result.classId,
        className: result.className,
        students: result.students.map(toAssignedStudentSummary),
        assignedCount: result.assignedCount,
      });
    } catch (error) {
      return handleError(error);
    }
  }
);
