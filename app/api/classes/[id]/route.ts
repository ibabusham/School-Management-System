import { createRouteHandler } from "@/app/utils/create-route-handles";
import { deleteClass, getClassById, updateClass } from "../Services/classes.services";
import { CLASS_DELETED_MESSAGE } from "../responses";
import { updateClassSchema } from "../schemas";
import { assertAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { NextResponse } from "next/server";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     tags: [Classes]
 *     summary: Get class by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Class details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassResponse'
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
 *         description: Class not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: only admins may view class details
    assertAdmin(auth);

    const { id } = await context.params;
    const classData = await getClassById(id);
    return NextResponse.json({ classData });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/classes/{id}:
 *   patch:
 *     tags: [Classes]
 *     summary: Update class
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Class id (UUID of the class record to update)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateClassRequest'
 *     responses:
 *       200:
 *         description: Class updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassResponse'
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
 *         description: Class not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const PATCH = createRouteHandler(updateClassSchema, async (request, body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: only admins may update classes
    assertAdmin(auth);

    const { id } = await context.params;
    const classData = await updateClass(id, body);
    return NextResponse.json({ classData });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     tags: [Classes]
 *     summary: Delete class
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Class deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteClassResponse'
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
 *         description: Class not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const DELETE = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: only admins may delete classes
    assertAdmin(auth);

    const { id } = await context.params;
    const classData = await deleteClass(id);
    return NextResponse.json({
      message: CLASS_DELETED_MESSAGE,
      classData,
    });
  } catch (error) {
    return handleError(error);
  }
});
