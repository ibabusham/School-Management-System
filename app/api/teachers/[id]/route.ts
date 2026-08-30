import { NextResponse } from "next/server";
import { deleteTeacher } from "@/app/api/teachers/services/teacher.service";
import { getTeacherById } from "@/app/api/teachers/services/teacher.service";
import { updateTeacher } from "@/app/api/teachers/services/teacher.service";
import { updateTeacherSchema } from "@/app/api/teachers/schemas";
import { ACCOUNT_DELETED_MESSAGE } from "@/app/api/teachers/responses";
import {
  assertAdmin,
  assertTeacherProfileReadAccess,
  assertTeacherProfileWriteAccess,
} from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
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
    const auth = await getAuthPayload(request);
    const { id } = await context.params;
    // RBAC: admin (any) or teacher (own profile only)
    assertTeacherProfileReadAccess(auth, id);

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
 *           format: uuid
 *         description: Teacher id (User id of the teacher record to update)
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
    const auth = await getAuthPayload(request);
    const { id } = await context.params;
    // RBAC: admin (any) or teacher (own profile only)
    assertTeacherProfileWriteAccess(auth, id);

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
 *               $ref: '#/components/schemas/DeleteTeacherResponse'
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
    const auth = await getAuthPayload(request);
    // RBAC: only admins may delete teachers
    assertAdmin(auth);

    const { id } = await context.params;
    const teacher = await deleteTeacher(id);
    return NextResponse.json({
      message: ACCOUNT_DELETED_MESSAGE,
      teacher,
    });
  } catch (error) {
    return handleError(error);
  }
});
