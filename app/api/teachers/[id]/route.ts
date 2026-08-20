import { NextResponse } from "next/server";
import { deleteTeacher } from "@/app/api/teachers/services/teacher.service";
import { getTeacherById } from "@/app/api/teachers/services/teacher.service";
import { updateTeacher } from "@/app/api/teachers/services/teacher.service";
import { updateTeacherSchema } from "@/app/api/teachers/schemas";
import { handleError } from "@/app/utils/errors.utility";
import { createRouteHandler } from "@/app/utils/create-route-handles";

/**
 * @swagger
 * /api/teachers/{id}:
 *   get:
 *     tags: [Teachers]
 *     summary: Get teacher by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher id (User id)
 *     responses:
 *       200:
 *         description: Teacher details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request, body, context) => {
  try {
    const { id } = await context.params;
    const teacher = await getTeacherById(id);
    return NextResponse.json({ teacher });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/teachers/{id}:
 *   patch:
 *     tags: [Teachers]
 *     summary: Update teacher
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher id (User id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTeacherRequest'
 *     responses:
 *       200:
 *         description: Teacher updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherResponse'
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
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const PATCH = createRouteHandler(updateTeacherSchema, async (request, body, context) => {
  try {
    const { id } = await context.params;
    const teacher = await updateTeacher(id, body);
    return NextResponse.json({ teacher });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/teachers/{id}:
 *   delete:
 *     tags: [Teachers]
 *     summary: Soft-delete teacher
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher id (User id)
 *     responses:
 *       200:
 *         description: Teacher soft-deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const DELETE = createRouteHandler(null, async (request, body, context) => {
  try {
    const { id } = await context.params;
    const teacher = await deleteTeacher(id);
    return NextResponse.json({ teacher });
  } catch (error) {
    return handleError(error);
  }
});
