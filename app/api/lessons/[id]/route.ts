import { createRouteHandler } from "@/app/utils/create-route-handles";
import { handleError } from "@/app/utils/errors.utility";
import { NextResponse } from "next/server";
import { deleteLesson, updateLesson } from "../services/lessons.services";
import { parseLessonRouteId, updateLessonSchema } from "../schemas";
import { findLessonById } from "../services/lessons.services";
import {
  LESSON_DELETED_MESSAGE,
  LESSON_UPDATED_MESSAGE,
  toLesson,
} from "../responses";

/**
 * @swagger
 * /api/lessons/{id}:
 *   get:
 *     tags: [Lessons]
 *     summary: Get lesson by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson id
 *     responses:
 *       200:
 *         description: Lesson found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LessonResponse'
 *       400:
 *         description: Invalid lesson id
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
 *         description: Lesson not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (_request, _body, context) => {
  try {
    const { id } = await context.params;
    const lessonId = parseLessonRouteId(id);
    const lesson = await findLessonById(lessonId);
    return NextResponse.json({ lesson: toLesson(lesson) });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/lessons/{id}:
 *   patch:
 *     tags: [Lessons]
 *     summary: Update lesson
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLessonRequest'
 *     responses:
 *       200:
 *         description: Lesson updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateLessonResponse'
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
 *         description: Lesson or subject not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const PATCH = createRouteHandler(updateLessonSchema, async (_request, body, context) => {
  try {
    const { id } = await context.params;
    const lessonId = parseLessonRouteId(id);
    const lesson = await updateLesson(lessonId, body);
    return NextResponse.json({
      message: LESSON_UPDATED_MESSAGE,
      lesson: toLesson(lesson),
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/lessons/{id}:
 *   delete:
 *     tags: [Lessons]
 *     summary: Delete lesson
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lesson id
 *     responses:
 *       200:
 *         description: Lesson deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteLessonResponse'
 *       400:
 *         description: Invalid lesson id
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
 *         description: Lesson not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const DELETE = createRouteHandler(null, async (_request, _body, context) => {
  try {
    const { id } = await context.params;
    const lessonId = parseLessonRouteId(id);
    const lesson = await deleteLesson(lessonId);
    return NextResponse.json({
      message: LESSON_DELETED_MESSAGE,
      lesson: toLesson(lesson),
    });
  } catch (error) {
    return handleError(error);
  }
});
