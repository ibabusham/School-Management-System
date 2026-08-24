import { createRouteHandler } from "@/app/utils/create-route-handles";
import { createExam, getExamList } from "./services/exams.services";
import { createExamSchema, examListQuerySchema } from "./schemas";
import { NextResponse } from "next/server";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/exams:
 *   get:
 *     tags: [Exams]
 *     summary: List exams
 *     description: Returns paginated exams, optionally filtered by subject
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by subject id
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
 *         description: Paginated list of exams
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamListResponse'
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
 */
export const GET = createRouteHandler(null, async (request) => {
  try {
    const queryParams = request.nextUrl.searchParams;
    const parsed = examListQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
      subjectId: queryParams.get("subjectId") ?? undefined,
    });

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await getExamList(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/exams:
 *   post:
 *     tags: [Exams]
 *     summary: Create exam
 *     description: Creates an exam for a subject
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateExamRequest'
 *           example:
 *             examName: "Midterm Mathematics"
 *             examDate: "2025-11-15"
 *             subjectId: "00000000-0000-4000-8000-000000000001"
 *             maximumGrade: 100
 *     responses:
 *       201:
 *         description: Exam created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamResponse'
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
 *         description: Subject not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(createExamSchema, async (_request, body) => {
  try {
    const exam = await createExam(body);
    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});
