import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { assignSubjectToClass } from "../../Services/subjects.services";
import { assignSubjectToClassSchema } from "../../schemas";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/subjects/{id}/class:
 *   post:
 *     tags: [Subjects]
 *     summary: Reassign subject to class
 *     description: Updates the class a subject belongs to
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignSubjectToClassRequest'
 *     responses:
 *       200:
 *         description: Subject reassigned to class
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubjectResponse'
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
 *         description: Subject or class not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(
  assignSubjectToClassSchema,
  async (request, body, context) => {
    try {
      const auth = await getAuthPayload(request);

      const { id } = await context.params;
      const subject = await assignSubjectToClass(id, body);
      return NextResponse.json({ subject });
    } catch (error) {
      return handleError(error);
    }
  }
);
