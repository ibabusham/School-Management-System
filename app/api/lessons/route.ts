import { createRouteHandler } from "@/app/utils/create-route-handles";
import { handleError } from "@/app/utils/errors.utility";
import { NextResponse } from "next/server";
import { createLessonSchema } from "./schemas";
import { lessonListQuerySchema } from "./schemas";
import { createLesson, getLessonList } from "./services/lessons.services";
import { LESSON_CREATED_MESSAGE, toLessonSummary } from "./responses";
import type { CreateLessonInput } from "./schemas";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";

/**
 * @swagger
 * /api/lessons:
 *   get:
 *     tags: [Lessons]
 *     summary: List lessons
 *     description: Returns paginated lessons, optionally filtered by subject
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
 *         description: Paginated list of lessons
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LessonListResponse'
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
 */
export const GET = createRouteHandler(null, async (request) => {
  try {
    const auth = await getAuthPayload(request);

    const queryParams = request.nextUrl.searchParams;
    const parsed = lessonListQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
      subjectId: queryParams.get("subjectId") ?? undefined,
    });

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await getLessonList(parsed.data, auth);
    return NextResponse.json({
      data: result.data.map(toLessonSummary),
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/lessons:
 *   post:
 *     tags: [Lessons]
 *     summary: Create lesson
 *     description: Creates a lesson for a subject
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLessonRequest'
 *           example:
 *             lessonTitle: "Introduction to Algebra"
 *             lessonDescription: "Basic algebraic concepts"
 *             subjectId: "00000000-0000-4000-8000-000000000001"
 *             lessonDate: "2025-12-01"
 *             learningObjectinve: "Understand variables and expressions"
 *             learningMaterial: "https://example.com/algebra-intro.pdf"
 *             completionStatus: "INCOMPLEATE"
 *     responses:
 *       201:
 *         description: Lesson created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateLessonResponse'
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
 *         description: Subject not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(createLessonSchema, async (request, body: CreateLessonInput) => {
  try {
    const auth = await getAuthPayload(request);

    const lesson = await createLesson(body, auth);
    return NextResponse.json(
      {
        message: LESSON_CREATED_MESSAGE,
        lesson: toLessonSummary(lesson),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
});
