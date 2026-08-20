import { NextResponse } from "next/server";
import { assignSubjectToTeacherSchema, unassignSubjectFromTeacherSchema } from "../../schemas";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { assignSubjectToTeacher, unassignSubjectFromTeacher } from "../../Services/subjects.services";

/**
 * @swagger
 * /api/subjects/{id}/teacher:
 *   post:
 *     tags: [Subjects]
 *     summary: Assign subject to teacher
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
 *             $ref: '#/components/schemas/AssignSubjectToTeacherInput'
 *     responses:
 *       200:
 *         description: Subject assigned to teacher
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
export const POST = createRouteHandler(assignSubjectToTeacherSchema, async (request, body, context) => {
  try {
    const { id } = await context.params;
    const result = await assignSubjectToTeacher({ ...body, subject_id: id });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
});

/**
 * @swagger
 * /api/subjects/{id}/teacher:
 *   delete:
 *     tags: [Subjects]
 *     summary: Unassign subject from teacher
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
 *             $ref: '#/components/schemas/UnassignSubjectFromTeacherInput'
 *     responses:
 *       200:
 *         description: Subject unassigned from teacher
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
export const DELETE = createRouteHandler(unassignSubjectFromTeacherSchema, async (request, body, context) => {
  try {
    const { id } = await context.params;
    const result = await unassignSubjectFromTeacher({ ...body, subject_id: id });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
});