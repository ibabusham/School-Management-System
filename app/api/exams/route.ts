import { createRouteHandler } from "@/app/utils/create-route-handles";
import { createExam, getExamList } from "./services/exams.services";
import { EXAM_CREATED_MESSAGE, toExamSummary } from "./responses";
import { createExamSchema, examListQuerySchema } from "./schemas";
import { assertTeacherOrAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import {
  getScopedSubjectIds,
  requireTeacherOwnsSubject,
} from "@/app/api/auth/services/teacher-scope";
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
    const auth = await getAuthPayload(request);
    // RBAC: students blocked; teachers only see exams for their subjects
    assertTeacherOrAdmin(auth);

    const queryParams = request.nextUrl.searchParams;
    const parsed = examListQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
      subjectId: queryParams.get("subjectId") ?? undefined,
    });

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const scopedSubjectIds = await getScopedSubjectIds(auth);
    const result = await getExamList(parsed.data, scopedSubjectIds);
    return NextResponse.json({
      data: result.data.map(toExamSummary),
      pagination: result.pagination,
    });
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
 *               $ref: '#/components/schemas/CreateExamResponse'
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
export const POST = createRouteHandler(createExamSchema, async (request, body) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: teacher must own the target subject; students blocked
    assertTeacherOrAdmin(auth);
    await requireTeacherOwnsSubject(auth, body.subjectId);

    const exam = await createExam(body);
    return NextResponse.json(
      {
        message: EXAM_CREATED_MESSAGE,
        exam: toExamSummary(exam),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
});
