import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { deleteTerm, getTerm, updateTerm } from "../services/terms.services";
import { handleError } from "@/app/utils/errors.utility";
import { updateTermSchema } from "../schemas";
import {
  TERM_DELETED_MESSAGE,
  TERM_UPDATED_MESSAGE,
} from "@/app/api/shared/operation-messages";
import {
  assertAdmin,
  assertCalendarReadAccess,
} from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";

/**
 * @swagger
 * /api/terms/{id}:
 *   get:
 *     tags: [Terms]
 *     summary: Get term by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Term id
 *     responses:
 *       200:
 *         description: Term found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TermResponse'
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
 *         description: Term not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: calendar read — admin, teacher, and student may view a term
    assertCalendarReadAccess(auth);

    const { id } = await context.params;
    const term = await getTerm(id);
    return NextResponse.json({ term });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/terms/{id}:
 *   patch:
 *     tags: [Terms]
 *     summary: Update term
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Term id (UUID of the term record to update)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTermRequest'
 *           example:
 *             termName: "Spring Semester"
 *             startDate: "2026-01-10"
 *             endDate: "2026-05-30"
 *     responses:
 *       200:
 *         description: Term updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateTermResponse'
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
 *         description: Term or academic year not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const PATCH = createRouteHandler(updateTermSchema, async (request, body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: only admins may update terms
    assertAdmin(auth);

    const { id } = await context.params;
    const term = await updateTerm(id, body);
    return NextResponse.json({
      message: TERM_UPDATED_MESSAGE,
      term,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/terms/{id}:
 *   delete:
 *     tags: [Terms]
 *     summary: Delete term
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Term id
 *     responses:
 *       200:
 *         description: Term deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteTermResponse'
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
 *         description: Term not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const DELETE = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: only admins may delete terms
    assertAdmin(auth);

    const { id } = await context.params;
    const term = await deleteTerm(id);
    return NextResponse.json({
      message: TERM_DELETED_MESSAGE,
      term,
    });
  } catch (error) {
    return handleError(error);
  }
});
