import { getClassListQuerySchema, createClassSchema } from "./schemas";
import { createClass, getClassList } from "./Services/classes.services";
import { NextResponse } from "next/server";
import { assertAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
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
    // RBAC: only admins may list classes
    assertAdmin(auth);

    const queryParams = request.nextUrl.searchParams;
    const parsed = getClassListQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
    });
  if (!parsed.success) {
    return handleError(parsed.error);
  }
  const result = await getClassList(parsed.data);
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
 *     description: Create a class and link it to an academic year. Either provide an existing academicYearId, or provide yearName, startDate, and endDate to create a new academic year inline.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClassRequest'
 *           example:
 *             className: "First Grade"
 *             academicYearId: "123e4567-e89b-12d3-a456-426614174000"
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
 *       403:
 *         description: Forbidden — insufficient role or out-of-scope access
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(createClassSchema, async (request, body) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: only admins may create classes
    assertAdmin(auth);

    const classData = await createClass(body);
    return NextResponse.json({ classData }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});
