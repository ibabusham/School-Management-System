import { NextResponse } from "next/server";
import { createTeacher, listTeachers } from "./services/teacher.service";
import { createTeacherSchema, teacherListQuerySchema } from "@/app/api/teachers/schemas";
import {
  ACCOUNT_CREATED_MESSAGE,
  toTeacherSummary,
} from "@/app/api/teachers/responses";
import { handleError } from "@/app/utils/errors.utility";
import { createRouteHandler } from "@/app/utils/create-route-handles";

/**
 * @swagger
 * /api/teachers:
 *   get:
 *     tags: [Teachers]
 *     summary: List teachers
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: Paginated teachers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherListResponse'
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
    const parsed = teacherListQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const result = await listTeachers(parsed.data);
    return NextResponse.json({
      data: result.data.map(toTeacherSummary),
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
}); 

/**
 * @swagger
 * /api/teachers:
 *   post:
 *     tags: [Teachers]
 *     summary: Create teacher
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeacherRequest'
 *           example:
 *            username: "jane.smith"
 *            employId: 12345
 *            name: "Jane Smith"
 *            password: "password"
 *            email: "jane.smith@example.com"
 *            phoneNumber: "1234567890"
 *            specilization: "Mathematics"
 *     responses:
 *       201:
 *         description: Teacher created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateTeacherResponse'
 *       400:
 *         description: Validation error or duplicate employId
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
export const POST = createRouteHandler(createTeacherSchema, async (request, body) => {
  try {
    const teacher = await createTeacher(body);
    return NextResponse.json(
      {
        message: ACCOUNT_CREATED_MESSAGE,
        teacher: toTeacherSummary(teacher),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
});
