import { createStudentSchema, studentListQuerySchema } from "@/app/api/students/schemas";
import { createStudent, listStudents } from "@/app/api/students/services/student.service";
import {
  ACCOUNT_CREATED_MESSAGE,
  toStudentSummary,
} from "@/app/api/students/responses";
import { NextResponse } from "next/server";
import { handleError } from "@/app/utils/errors.utility";
import { createRouteHandler } from "@/app/utils/create-route-handles";

/**
 * @swagger
 * /api/students:
 *   get:
 *     tags: [Students]
 *     summary: List students
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
 *         description: Paginated students
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentListResponse'
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
     const parsed = studentListQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const result = await listStudents(parsed.data);
    return NextResponse.json({
      data: result.data.map(toStudentSummary),
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
  });
/**
 * @swagger
 * /api/students:
 *   post:
 *     tags: [Students]
 *     summary: Create student
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStudentRequest'
 *           example:
 *             studentId: 1234567890
 *             username: "john.doe"
 *             firstName: "John"
 *             lastName: "Doe"
 *             email: "john.doe@example.com"
 *             password: "password"
 *             dateOfBirth: "1990-01-01"
 *             gender: "MALE"
 *             phoneNumber: "1234567890"
 *             enrollmentDate: "2025-01-01"
 *     responses:
 *       201:
 *         description: Student created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateStudentResponse'
 *       400:
 *         description: Validation error or duplicate studentId
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
export const POST = createRouteHandler(createStudentSchema, async (request, body) => {
  try {
    const student = await createStudent(body);
    return NextResponse.json(
      {
        message: ACCOUNT_CREATED_MESSAGE,
        student: toStudentSummary(student),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
});
