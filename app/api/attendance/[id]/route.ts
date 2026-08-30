import { NextResponse } from "next/server";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { handleError } from "@/app/utils/errors.utility";
import { updateAttendanceSchema } from "../schemas";
import {
  ATTENDANCE_DELETED_MESSAGE,
  ATTENDANCE_UPDATED_MESSAGE,
  toAttendance,
} from "../responses";
import {
  deleteAttendance,
  getAttendance,
  updateAttendance,
} from "../services/attendance.services";

/**
 * @swagger
 * /api/attendance/{id}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance record by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Attendance record found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Attendance record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (_request, _body, context) => {
  try {
    const { id } = await context.params;
    const attendance = await getAttendance(id);

    return NextResponse.json({ attendance: toAttendance(attendance) });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/attendance/{id}:
 *   patch:
 *     tags: [Attendance]
 *     summary: Update attendance record
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attendance record id (UUID of the attendance entry to update)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAttendanceRequest'
 *     responses:
 *       200:
 *         description: Attendance updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateAttendanceResponse'
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
 *       404:
 *         description: Attendance record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Duplicate attendance record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const PATCH = createRouteHandler(
  updateAttendanceSchema,
  async (_request, body, context) => {
    try {
      const { id } = await context.params;
      const attendance = await updateAttendance(id, body);

      return NextResponse.json({
        message: ATTENDANCE_UPDATED_MESSAGE,
        attendance: toAttendance(attendance),
      });
    } catch (error) {
      return handleError(error);
    }
  }
);

/**
 * @swagger
 * /api/attendance/{id}:
 *   delete:
 *     tags: [Attendance]
 *     summary: Delete attendance record
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Attendance deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteAttendanceResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Attendance record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const DELETE = createRouteHandler(null, async (_request, _body, context) => {
  try {
    const { id } = await context.params;
    const attendance = await deleteAttendance(id);

    return NextResponse.json({
      message: ATTENDANCE_DELETED_MESSAGE,
      attendance: toAttendance(attendance),
    });
  } catch (error) {
    return handleError(error);
  }
});
