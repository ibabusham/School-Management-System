import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { deleteExam, getExam, updateExam } from "../services/exams.services";
import {
  EXAM_DELETED_MESSAGE,
  EXAM_UPDATED_MESSAGE,
} from "../responses";
import { updateExamSchema } from "../schemas";
import { assertTeacherOrAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import {
  requireTeacherOwnsExam,
  requireTeacherOwnsSubject,
} from "@/app/api/auth/services/teacher-scope";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/exams/{id}:
 *   get:
 *     tags: [Exams]
 *     summary: Get exam by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exam id
 *     responses:
 *       200:
 *         description: Exam found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Exam not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    const { id } = await context.params;
    // RBAC: teacher must own the exam's subject
    assertTeacherOrAdmin(auth);
    await requireTeacherOwnsExam(auth, id);

    const exam = await getExam(id);
    return NextResponse.json({ exam });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/exams/{id}:
 *   patch:
 *     tags: [Exams]
 *     summary: Update exam
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exam id (UUID of the exam record to update)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateExamRequest'
 *     responses:
 *       200:
 *         description: Exam updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateExamResponse'
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
 *         description: Exam or subject not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const PATCH = createRouteHandler(updateExamSchema, async (request, body, context) => {
  try {
    const auth = await getAuthPayload(request);
    const { id } = await context.params;
    // RBAC: teacher must own exam; if reassigning subject, must own new subject too
    assertTeacherOrAdmin(auth);
    await requireTeacherOwnsExam(auth, id);
    if (body.subjectId) {
      await requireTeacherOwnsSubject(auth, body.subjectId);
    }

    const exam = await updateExam(id, body);
    return NextResponse.json({
      message: EXAM_UPDATED_MESSAGE,
      exam,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/exams/{id}:
 *   delete:
 *     tags: [Exams]
 *     summary: Delete exam
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Exam id
 *     responses:
 *       200:
 *         description: Exam deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteExamResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Exam not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const DELETE = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    const { id } = await context.params;
    // RBAC: teacher must own the exam's subject
    assertTeacherOrAdmin(auth);
    await requireTeacherOwnsExam(auth, id);

    const exam = await deleteExam(id);
    return NextResponse.json({
      message: EXAM_DELETED_MESSAGE,
      exam,
    });
  } catch (error) {
    return handleError(error);
  }
});
