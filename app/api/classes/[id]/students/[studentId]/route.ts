import { NextResponse } from "next/server";
import { unassignStudentFromClass } from "../../../Services/classes.services";
import { createRouteHandler } from "@/app/utils/create-route-handles";
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
 *               $ref: '#/components/schemas/StudentResponse'
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
    const { id, studentId } = await context.params;
    const result = await unassignStudentFromClass(id, studentId);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
});
