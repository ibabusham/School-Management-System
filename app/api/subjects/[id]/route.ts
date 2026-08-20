import { NextResponse } from "next/server";
import { deleteSubjectSchema, getSubjectByIdSchema, updateSubjectSchema } from "../schemas";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { deleteSubject, getSubjectById, updateSubject } from "../Services/subjects.services";


    /**
     * @swagger
     * /api/subjects/{id}:
     *   get:
     *     tags: [Subjects]
     *     summary: Get subject by ID
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Subject found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Subject'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       404:
     *         description: Subject not found
     *         content:
     *           application/json:
     *             schema:
     */
export const GET = createRouteHandler(getSubjectByIdSchema, async (request, body) => {
  try {
    const result = await getSubjectById(body.subject_id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
});
/**
 * @swagger
 * /api/subjects/{id}:
 *   put:
 *     tags: [Subjects]
 *     summary: Update subject by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subject updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subject'
 *       401:
 *         description: Unauthorized
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

export const PUT = createRouteHandler(updateSubjectSchema, async (request, body, context) => {
  try {
    const { id } = await context.params;
    const result = await updateSubject({ ...body, subject_id: id });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
});

/**
 * @swagger
 * /api/subjects/{id}:
 *   delete:
 *     tags: [Subjects]
 *     summary: Delete subject by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subject deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subject'
 *       401:
 *         description: Unauthorized
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
export const DELETE = createRouteHandler(deleteSubjectSchema, async (request, body, context) => {
  try {
    const { id } = await context.params;
    const result = await deleteSubject(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
});