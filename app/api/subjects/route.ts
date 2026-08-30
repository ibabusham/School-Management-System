import { createRouteHandler } from "@/app/utils/create-route-handles";
import { createSubject, getSubjectList } from "./Services/subjects.services";
import { NextResponse } from "next/server";
import { createSubjectSchema, subjectListQuerySchema } from "./schemas";
import {
  SUBJECT_CREATED_MESSAGE,
  toSubjectSummary,
} from "./responses";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     tags: [Subjects]
 *     summary: List subjects
 *     description: Returns paginated subjects, optionally filtered by search query
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by subject name or code (partial match)
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
 *         description: Paginated list of subjects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubjectListResponse'
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
    const parsed = subjectListQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
      search: queryParams.get("search") ?? undefined,
    });

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await getSubjectList(parsed.data, auth);
    return NextResponse.json({
      data: result.data.map(toSubjectSummary),
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/subjects:
 *   post:
 *     tags: [Subjects]
 *     summary: Create subject
 *     description: Creates a subject and assigns it to a class and teacher
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubjectRequest'
 *           example:
 *             subjectName: "Mathematics"
 *             subjectCode: "MATH-101"
 *             description: "Introductory mathematics"
 *             classId: "00000000-0000-4000-8000-000000000001"
 *             teacherId: "00000000-0000-4000-8000-000000000002"
 *     responses:
 *       201:
 *         description: Subject created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateSubjectResponse'
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
 *         description: Class or teacher not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(createSubjectSchema, async (request, body) => {
  try {
    const auth = await getAuthPayload(request);

    const subject = await createSubject(body);
    return NextResponse.json(
      {
        message: SUBJECT_CREATED_MESSAGE,
        subject: toSubjectSummary(subject),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
});
