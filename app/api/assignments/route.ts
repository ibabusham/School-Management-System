import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { handleError } from "@/app/utils/errors.utility";
import { assignmentListQuerySchema } from "./schemas";
import { createAssignment, getAssignmentList } from "./services/assignments.services";
import { ASSIGNMENT_CREATED_MESSAGE, toAssignmentSummary } from "./responses";
import { createAssignmentSchema } from "./schemas";
import { assertTeacherOrAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import {
  getScopedSubjectIds,
  requireTeacherOwnsSubject,
} from "@/app/api/auth/services/teacher-scope";

/**
 * @swagger
 * /api/assignments:
 *   get:
 *     tags: [Assignments]
 *     summary: List assignments
 *     description: Returns paginated assignments, optionally filtered by subject
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
 *         description: Paginated list of assignments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentListResponse'
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
    // RBAC: students blocked; teachers only see assignments for their subjects
    assertTeacherOrAdmin(auth);

    const queryParams = request.nextUrl.searchParams;
    const parsed = assignmentListQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
      subjectId: queryParams.get("subjectId") ?? undefined,
    });

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const scopedSubjectIds = await getScopedSubjectIds(auth);
    const result = await getAssignmentList(parsed.data, scopedSubjectIds);
    return NextResponse.json({
      data: result.data.map(toAssignmentSummary),
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     tags: [Assignments]
 *     summary: Create assignment
 *     description: Creates an assignment for a subject
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAssignmentRequest'
 *           example:
 *             title: "Homework 1"
 *             description: "Chapter 3 exercises"
 *             dueDate: "2025-12-01"
 *             maximumGrade: 100
 *             submissionInstructions: "Submit as PDF"
 *             subjectId: "00000000-0000-4000-8000-000000000001"
 *             attachments: "https://example.com/file.pdf"
 *     responses:
 *       201:
 *         description: Assignment created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateAssignmentResponse'
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
export const POST = createRouteHandler(createAssignmentSchema, async (request, body) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: teacher must own the target subject; students blocked
    assertTeacherOrAdmin(auth);
    await requireTeacherOwnsSubject(auth, body.subjectId);

    const assignment = await createAssignment(body);
    return NextResponse.json(
      {
        message: ASSIGNMENT_CREATED_MESSAGE,
        assignment: toAssignmentSummary(assignment),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
});
