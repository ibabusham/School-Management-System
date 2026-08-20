import { createRouteHandler } from "@/app/utils/create-route-handles";
import {
  CreateAcademicYear,
  createAcademicYearSchema,
  getAcademicYearSchema,
} from "./schemas";
import { createAcademicYear, findAcademicYear } from "./services/academicyear.services";
import { handleError } from "@/app/utils/errors.utility";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/academicYears:
 *   get:
 *     tags: [Academic Years]
 *     summary: List academic years
 *     description: Returns paginated academic years, optionally filtered by search query
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by year name (partial match)
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
 *         description: Paginated list of academic years
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicYearListResponse'
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
    const queryParams = request.nextUrl.searchParams;
    const parsed = getAcademicYearSchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
      search: queryParams.get("search") ?? undefined,
    });

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await findAcademicYear(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/academicYears:
 *   post:
 *     tags: [Academic Years]
 *     summary: Create academic year
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAcademicYearRequest'
 *           example:
 *             name: "2025-2026"
 *             startDate: "2025-09-01"
 *             endDate: "2026-06-30"
 *     responses:
 *       201:
 *         description: Academic year created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicYear'
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
export const POST = createRouteHandler(
  createAcademicYearSchema,
  async (request, body: CreateAcademicYear) => {
    try {
      const academicYear = await createAcademicYear(body);
      return NextResponse.json(academicYear, { status: 201 });
    } catch (error) {
      return handleError(error);
    }
  }
);
