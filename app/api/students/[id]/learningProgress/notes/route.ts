import { NextResponse } from "next/server";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { handleError } from "@/app/utils/errors.utility";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import {
  createProgressNoteSchema,
  learningProgressNotesQuerySchema,
} from "../schemas";
import {
  createProgressNote,
  listProgressNotes,
} from "../services/learningProgress.services";
import {
  PROGRESS_NOTE_CREATED_MESSAGE,
  toProgressNote,
} from "../responses";

/**
 * @swagger
 * /api/students/{id}/learningProgress/notes:
 *   get:
 *     tags: [Students]
 *     summary: List progress notes for a student
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student id (User id)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated progress notes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProgressNoteListResponse'
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
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    const { id } = await context.params;

    const queryParams = request.nextUrl.searchParams;
    const parsed = learningProgressNotesQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await listProgressNotes(id, parsed.data, auth);

    return NextResponse.json({
      data: result.data.map(toProgressNote),
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/students/{id}/learningProgress/notes:
 *   post:
 *     tags: [Students]
 *     summary: Create a progress note for a student
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student id (User id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProgressNoteRequest'
 *     responses:
 *       201:
 *         description: Progress note created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateProgressNoteResponse'
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
 *         description: Student or teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(createProgressNoteSchema, async (request, body, context) => {
  try {
    const auth = await getAuthPayload(request);
    const { id } = await context.params;

    const note = await createProgressNote(id, auth, body);

    return NextResponse.json(
      {
        message: PROGRESS_NOTE_CREATED_MESSAGE,
        progressNote: toProgressNote(note),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
});
