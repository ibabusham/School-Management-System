import { NextResponse } from "next/server";
import { updateSubjectSchema } from "../schemas";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { deleteSubject, getSubjectById, updateSubject } from "../Services/subjects.services";
import {
  SUBJECT_DELETED_MESSAGE,
  SUBJECT_UPDATED_MESSAGE,
} from "../responses";
import { assertAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { requireTeacherOwnsSubject } from "@/app/api/auth/services/teacher-scope";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/subjects/{id}:
 *   get:
 *     tags: [Subjects]
 *     summary: Get subject by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subject id
 *     responses:
 *       200:
 *         description: Subject found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubjectResponse'
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
 *         description: Subject not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    const { id } = await context.params;
    // RBAC: admin (any) or teacher (must own this subject); students denied
    await requireTeacherOwnsSubject(auth, id);

    const subject = await getSubjectById(id);
    return NextResponse.json({ subject });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/subjects/{id}:
 *   patch:
 *     tags: [Subjects]
 *     summary: Update subject
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subject id (UUID of the subject record to update)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSubjectRequest'
 *     responses:
 *       200:
 *         description: Subject updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateSubjectResponse'
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
 *         description: Subject, class, or teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const PATCH = createRouteHandler(updateSubjectSchema, async (request, body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: only admins may update subjects
    assertAdmin(auth);

    const { id } = await context.params;
    const subject = await updateSubject(id, body);
    return NextResponse.json({
      message: SUBJECT_UPDATED_MESSAGE,
      subject,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/subjects/{id}:
 *   delete:
 *     tags: [Subjects]
 *     summary: Delete subject
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subject id
 *     responses:
 *       200:
 *         description: Subject deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteSubjectResponse'
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
 *         description: Subject not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const DELETE = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: only admins may delete subjects
    assertAdmin(auth);

    const { id } = await context.params;
    const subject = await deleteSubject(id);
    return NextResponse.json({
      message: SUBJECT_DELETED_MESSAGE,
      subject,
    });
  } catch (error) {
    return handleError(error);
  }
});
