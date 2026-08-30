import { NextResponse } from "next/server";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { handleError } from "@/app/utils/errors.utility";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { updateProgressNoteSchema } from "../../schemas";
import {
  deleteProgressNote,
  getProgressNote,
  updateProgressNote,
} from "../../services/learningProgress.services";
import {
  PROGRESS_NOTE_DELETED_MESSAGE,
  PROGRESS_NOTE_UPDATED_MESSAGE,
  toProgressNote,
} from "../../responses";

/**
 * @swagger
 * /api/students/{id}/learningProgress/notes/{noteId}:
 *   get:
 *     tags: [Students]
 *     summary: Get a progress note by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Progress note found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProgressNoteResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Progress note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    const { id, noteId } = await context.params;

    const note = await getProgressNote(id, noteId, auth);

    return NextResponse.json({ progressNote: toProgressNote(note) });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/students/{id}/learningProgress/notes/{noteId}:
 *   patch:
 *     tags: [Students]
 *     summary: Update a progress note
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student id (User id of the student who owns the progress note)
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Progress note id (UUID of the progress note to update)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProgressNoteRequest'
 *     responses:
 *       200:
 *         description: Progress note updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateProgressNoteResponse'
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
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Progress note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const PATCH = createRouteHandler(
  updateProgressNoteSchema,
  async (request, body, context) => {
    try {
      const auth = await getAuthPayload(request);
      const { id, noteId } = await context.params;

      const note = await updateProgressNote(id, noteId, auth, body);

      return NextResponse.json({
        message: PROGRESS_NOTE_UPDATED_MESSAGE,
        progressNote: toProgressNote(note),
      });
    } catch (error) {
      return handleError(error);
    }
  }
);

/**
 * @swagger
 * /api/students/{id}/learningProgress/notes/{noteId}:
 *   delete:
 *     tags: [Students]
 *     summary: Delete a progress note
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Progress note deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteProgressNoteResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Progress note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const DELETE = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    const { id, noteId } = await context.params;

    const note = await deleteProgressNote(id, noteId, auth);

    return NextResponse.json({
      message: PROGRESS_NOTE_DELETED_MESSAGE,
      progressNote: toProgressNote(note),
    });
  } catch (error) {
    return handleError(error);
  }
});
