import { NextResponse } from "next/server";
import { deleteStudent, getStudentById, updateStudent } from "@/app/api/students/services/student.service";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { handleError } from "@/app/utils/errors.utility";
import { updateStudentSchema } from "../schemas";
import {
  ACCOUNT_DELETED_MESSAGE,
} from "@/app/api/students/responses";
import {
  assertAdmin,
  assertStudentProfileReadAccess,
} from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Get student by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student id (User id)
 *     responses:
 *       200:
 *         description: Student details
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
 *       403:
 *         description: Forbidden — insufficient role or out-of-scope access
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request, body, context) => {
  try {
    const auth = await getAuthPayload(request);
    const { id } = await context.params;
    // RBAC: admin (any), teacher (in scope), or student (self only)
    await assertStudentProfileReadAccess(auth, id);

    const student = await getStudentById(id);
    return NextResponse.json({ student });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/students/{id}:
 *   patch:
 *     tags: [Students]
 *     summary: Update student
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student id (User id of the student record to update)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStudentRequest'
 *     responses:
 *       200:
 *         description: Student updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentResponse'
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
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const PATCH = createRouteHandler(updateStudentSchema, async (request, body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: only admins may update student records
    assertAdmin(auth);

    const { id } = await context.params;
    const student = await updateStudent(id, body);
    return NextResponse.json({ student });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/students/{id}:
 *   delete:
 *     tags: [Students]
 *     summary: Soft-delete student
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student id (User id)
 *     responses:
 *       200:
 *         description: Student soft-deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteStudentResponse'
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
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const DELETE = createRouteHandler(null, async (request, body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: only admins may delete student records
    assertAdmin(auth);

    const { id } = await context.params;
    const student = await deleteStudent(id);
    return NextResponse.json({
      message: ACCOUNT_DELETED_MESSAGE,
      student,
    });
  } catch (error) {
    return handleError(error);
  }
});
