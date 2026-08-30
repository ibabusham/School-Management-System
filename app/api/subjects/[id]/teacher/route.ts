import { NextResponse } from "next/server";
import { assignSubjectToTeacherSchema } from "../../schemas";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { assignSubjectToTeacher } from "../../Services/subjects.services";
import { assertAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/subjects/{id}/teacher:
 *   post:
 *     tags: [Subjects]
 *     summary: Reassign subject to teacher
 *     description: Updates the teacher assigned to a subject
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
 *             $ref: '#/components/schemas/AssignSubjectToTeacherRequest'
 *     responses:
 *       200:
 *         description: Subject reassigned to teacher
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
 *         description: Subject or teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(
  assignSubjectToTeacherSchema,
  async (request, body, context) => {
    try {
      const auth = await getAuthPayload(request);
      // RBAC: only admins may reassign subjects to teachers
      assertAdmin(auth);

      const { id } = await context.params;
      const subject = await assignSubjectToTeacher(id, body);
      return NextResponse.json({ subject });
    } catch (error) {
      return handleError(error);
    }
  }
);
