import { NextResponse } from "next/server";
import { unassignStudentFromClass } from "../../../Services/classes.services";
import { STUDENT_UNASSIGNED_MESSAGE } from "../../../responses";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { assertAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/classes/{id}/students/{studentId}:
 *   delete:
 *     tags: [Classes]
 *     summary: Unassign student from class
 *     description: Remove a student from a class by clearing their classId
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class id
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student id (User id)
 *     responses:
 *       200:
 *         description: Student unassigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnassignStudentResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Class or student not found in class
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const DELETE = createRouteHandler(null, async (request, body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: only admins may unassign students from classes
    assertAdmin(auth);

    const { id, studentId } = await context.params;
    const result = await unassignStudentFromClass(id, studentId);
    return NextResponse.json({
      message: STUDENT_UNASSIGNED_MESSAGE,
      ...result,
    });
  } catch (error) {
    return handleError(error);
  }
});
