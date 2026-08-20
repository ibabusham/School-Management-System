import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { assignSubjectToClass, unassignSubjectFromClass } from "../../Services/subjects.services";
import { assignSubjectToClassSchema } from "../../schemas";
import { unassignSubjectFromClassSchema } from "../../schemas";
/**
 * @swagger
 * /api/subjects/{id}/class:
 *   post:
 *     tags: [Subjects]
 *     summary: Assign subject to class
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignSubjectToClassInput'
 *     responses:
 *       200:
 *         description: Subject assigned to class
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subject'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Subject not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(assignSubjectToClassSchema, async (request, body, context) => {
  try {
    const { id } = await context.params;
    const result = await assignSubjectToClass({ ...body, subject_id: id });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
});

/**
 * @swagger
 * /api/subjects/{id}/class:
 *   delete:
 *     tags: [Subjects]
 *     summary: Unassign subject from class
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnassignSubjectFromClassInput'
 *     responses:
 *       200:
 *         description: Subject unassigned from class
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subject'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Subject not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const DELETE = createRouteHandler(unassignSubjectFromClassSchema, async (request, body, context) => {
  try {
    const { id } = await context.params;
    const result = await unassignSubjectFromClass({ ...body, subject_id: id });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
});