import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { handleError } from "@/app/utils/errors.utility";
import { updateAssignmentSchema, parseAssignmentRouteId } from "../schemas";
import {
  deleteAssignment,
  getAssignment,
  updateAssignment,
} from "../services/assignments.services";
import {
  ASSIGNMENT_DELETED_MESSAGE,
  ASSIGNMENT_UPDATED_MESSAGE,
} from "../responses";

/**
 * @swagger
 * /api/assignments/{id}:
 *   get:
 *     tags: [Assignments]
 *     summary: Get assignment by id
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
 *     responses:
 *       200:
 *         description: Assignment found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentResponse'
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
export const GET = createRouteHandler(null, async (_request, _body, context) => {
  try {
    const { id } = await context.params;
    const assignmentId = parseAssignmentRouteId(id);
    const assignment = await getAssignment(assignmentId);
    return NextResponse.json({ assignment });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/assignments/{id}:
 *   patch:
 *     tags: [Assignments]
 *     summary: Update assignment
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment id (UUID of the assignment record to update)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAssignmentRequest'
 *     responses:
 *       200:
 *         description: Assignment updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateAssignmentResponse'
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
 *         description: Assignment or subject not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const PATCH = createRouteHandler(updateAssignmentSchema, async (_request, body, context) => {
  try {
    const { id } = await context.params;
    const assignmentId = parseAssignmentRouteId(id);
    const assignment = await updateAssignment(assignmentId, body);
    return NextResponse.json({
      message: ASSIGNMENT_UPDATED_MESSAGE,
      assignment,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/assignments/{id}:
 *   delete:
 *     tags: [Assignments]
 *     summary: Delete assignment
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
 *     responses:
 *       200:
 *         description: Assignment deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteAssignmentResponse'
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
export const DELETE = createRouteHandler(null, async (_request, _body, context) => {
  try {
    const { id } = await context.params;
    const assignmentId = parseAssignmentRouteId(id);
    const assignment = await deleteAssignment(assignmentId);
    return NextResponse.json({
      message: ASSIGNMENT_DELETED_MESSAGE,
      assignment,
    });
  } catch (error) {
    return handleError(error);
  }
});
