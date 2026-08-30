import { NextResponse } from "next/server";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { handleError } from "@/app/utils/errors.utility";
import { attendanceListQuerySchema, createAttendanceSchema } from "./schemas";
import {
  ATTENDANCE_CREATED_MESSAGE,
  toAttendance,
} from "./responses";
import { createAttendance, getAttendanceList } from "./services/attendance.services";
import { assertTeacherOrAdmin } from "@/app/api/auth/services/authorize";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import {
  getScopedSubjectIds,
  requireTeacherOwnsSubject,
} from "@/app/api/auth/services/teacher-scope";

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: List attendance records
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
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Paginated attendance records
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AttendanceListResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: students blocked; teachers only see attendance for their subjects
    assertTeacherOrAdmin(auth);

    const queryParams = request.nextUrl.searchParams;
    const parsed = attendanceListQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
      studentId: queryParams.get("studentId") ?? undefined,
      subjectId: queryParams.get("subjectId") ?? undefined,
      fromDate: queryParams.get("fromDate") ?? undefined,
      toDate: queryParams.get("toDate") ?? undefined,
    });

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const scopedSubjectIds = await getScopedSubjectIds(auth);
    const result = await getAttendanceList(parsed.data, scopedSubjectIds);

    return NextResponse.json({
      data: result.data.map(toAttendance),
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/attendance:
 *   post:
 *     tags: [Attendance]
 *     summary: Record attendance
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAttendanceRequest'
 *     responses:
 *       201:
 *         description: Attendance recorded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateAttendanceResponse'
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
 *         description: Student or subject not found
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
export const POST = createRouteHandler(createAttendanceSchema, async (request, body) => {
  try {
    const auth = await getAuthPayload(request);
    // RBAC: teacher must own the target subject; students blocked
    assertTeacherOrAdmin(auth);
    await requireTeacherOwnsSubject(auth, body.subjectId);

    const attendance = await createAttendance(body);

    return NextResponse.json(
      {
        message: ATTENDANCE_CREATED_MESSAGE,
        attendance: toAttendance(attendance),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
});
