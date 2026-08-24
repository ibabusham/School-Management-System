import { NextResponse } from "next/server";
import { UpdateAcademicYear, updateAcademicYearSchema } from "../schemas";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import type { RouteContext } from "@/app/utils/create-route-handles";
import {
  deleteAcademicYear,
  findAcademicYearById,
  updateAcademicYear,
} from "../services/academicyear.services";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/academicYears/{id}:
 *   get:
 *     tags: [Academic Years]
 *     summary: Get academic year by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Academic year id
 *     responses:
 *       200:
 *         description: Academic year found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicYearResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Academic year not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (_request, _body, context) => {
  try {
    const { id } = await context.params;
    const academicYear = await findAcademicYearById(id);
    return NextResponse.json({ data: academicYear });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/academicYears/{id}:
 *   patch:
 *     tags: [Academic Years]
 *     summary: Update academic year by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Academic year id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAcademicYearRequest'
 *           example:
 *             name: "2025-2026 Updated"
 *             startDate: "2025-09-01"
 *             endDate: "2026-06-30"
 *     responses:
 *       200:
 *         description: Academic year updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicYearResponse'
 *       400:
 *         description: Validation error or another active academic year already exists
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
 *         description: Academic year not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const PATCH = createRouteHandler(
  updateAcademicYearSchema,
  async (_request, body: UpdateAcademicYear, context: RouteContext) => {
    try {
      const { id } = await context.params;
      const academicYear = await updateAcademicYear(id, body);
      return NextResponse.json({ data: academicYear });
    } catch (error) {
      return handleError(error);
    }
  }
);

/**
 * @swagger
 * /api/academicYears/{id}:
 *   delete:
 *     tags: [Academic Years]
 *     summary: Delete academic year by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Academic year id
 *     responses:
 *       200:
 *         description: Academic year deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicYearResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Academic year not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const DELETE = createRouteHandler(null, async (_request, _body, context) => {
  try {
    const { id } = await context.params;
    const academicYear = await deleteAcademicYear(id);
    return NextResponse.json({ data: academicYear });
  } catch (error) {
    return handleError(error);
  }
});
