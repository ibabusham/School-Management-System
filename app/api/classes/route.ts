import { createClassSchema } from "./schemas";
import { createClass, getClassList } from "./Services/classes.services";
import { NextResponse } from "next/server";
import { handleError } from "@/app/utils/errors.utility";
import { createRouteHandler } from "@/app/utils/create-route-handles";

/**
 * @swagger
 * /api/classes:
 *   get:
 *     tags: [Classes]
 *     summary: List classes
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
 *         description: Class list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassListResponse'
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
    const result = await getClassList({
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
 * /api/classes:
 *   post:
 *     tags: [Classes]
 *     summary: Create class
 *     description: Create a class and link it to an academic year. Either provide an existing academic_year_id, or provide name, startDate, and endDate to create a new academic year inline.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClassRequest'
 *           example:
 *             class_name: "First Grade"
 *             academic_year_id: "123e4567-e89b-12d3-a456-426614174000"
 *           
 *            
 *             
 *     responses:
 *       201:
 *         description: Class created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassResponse'
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
export const POST = createRouteHandler(createClassSchema, async (request, body) => {
  try {
    const classData = await createClass(body);
    return NextResponse.json({ classData }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});
