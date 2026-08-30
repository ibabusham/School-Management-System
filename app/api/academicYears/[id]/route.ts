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
import {
  ACADEMIC_YEAR_DELETED_MESSAGE,
  ACADEMIC_YEAR_UPDATED_MESSAGE,
} from "@/app/api/shared/operation-messages";
import {
  assertAdmin,
  assertCalendarReadAccess,
} from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";

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
export const GET = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: calendar read — admin, teacher, and student may view an academic year
    assertCalendarReadAccess(auth);

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
 *         description: Academic year id (UUID of the academic year record to update)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAcademicYearRequest'
 *           example:
 *             yearName: "2025-2026 Updated"
 *             startDate: "2025-09-01"
 *             endDate: "2026-06-30"
 *     responses:
 *       200:
 *         description: Academic year updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateAcademicYearResponse'
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
  async (request, body: UpdateAcademicYear, context: RouteContext) => {
    try {
      const auth = await getAuthPayload(request);
      // RBAC: only admins may update academic years
      assertAdmin(auth);

      const { id } = await context.params;
      const academicYear = await updateAcademicYear(id, body);
      return NextResponse.json({
        message: ACADEMIC_YEAR_UPDATED_MESSAGE,
        data: academicYear,
      });
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
 *               $ref: '#/components/schemas/DeleteAcademicYearResponse'
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
export const DELETE = createRouteHandler(null, async (request, _body, context) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: only admins may delete academic years
    assertAdmin(auth);

    const { id } = await context.params;
    const academicYear = await deleteAcademicYear(id);
    return NextResponse.json({
      message: ACADEMIC_YEAR_DELETED_MESSAGE,
      data: academicYear,
    });
  } catch (error) {
    return handleError(error);
  }
});
