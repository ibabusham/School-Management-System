import { createRouteHandler } from "@/app/utils/create-route-handles";
import { createSubject, getSubjectList } from "./Services/subjects.services";
import { NextResponse } from "next/server";
import { createSubjectSchema, getSubjectListQuerySchema } from "./schemas";


/**
 * @swagger
 * /api/subjects:
 *   post:
 *     tags: [Subjects]
 *     summary: Create subject
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubjectInput'
 *     responses:
 *       200:
 *         description: Subject created
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
export const POST = createRouteHandler(createSubjectSchema, async (request, body) => {
  try {
    const result = await createSubject(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
});

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     tags: [Subjects]
 *     summary: Get subject list
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subject list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubjectList'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(getSubjectListQuerySchema, async (request, body) => {
  try {
    const result = await getSubjectList(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
});