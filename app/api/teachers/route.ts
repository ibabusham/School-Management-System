import { NextResponse } from "next/server";
import { createTeacher, listTeachers } from "./services/teacher.service";
import { createTeacherSchema } from "@/app/api/teachers/schemas";
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
    const result = await listTeachers({
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
 *            employ_id: "12345"
 *            name: "Jane Smith"
 *            password: "password"
 *            email: "jane.smith@example.com"
 *            phonenumber: "1234567890"
 *            specilization: "Mathematics"
 *     responses:
 *       201:
 *         description: Teacher created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherResponse'
 *       400:
 *         description: Validation error or duplicate employ_id
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
    return NextResponse.json({ teacher }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});
