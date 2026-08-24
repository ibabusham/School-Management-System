import { createStudentSchema } from "@/app/api/students/schemas";
import { createStudent, listStudents } from "@/app/api/students/services/student.service";
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
    const result = await listStudents({
      page: parseInt(queryParams.get("page") || "1"),
      limit: parseInt(queryParams.get("limit") || "10"),
    });
    return NextResponse.json(result);
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
 *             student_id: 1234567890
 *             username: "john.doe"
 *             first_name: "John"
 *             last_name: "Doe"
 *             email: "john.doe@example.com"
 *             password: "password"
 *             date_of_birth: "1990-01-01"
 *             gender: "MALE"
 *             phonenumber: "1234567890"
 *             enrollment_date: "2025-01-01"
 *     responses:
 *       201:
 *         description: Student created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentResponse'
 *       400:
 *         description: Validation error or duplicate student_id
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
    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});
