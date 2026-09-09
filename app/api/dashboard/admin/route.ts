import { NextResponse } from "next/server";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { handleError } from "@/app/utils/errors.utility";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { listStudents } from "@/app/api/students/services/student.service";
import { toStudentSummary } from "@/app/api/students/responses";
import { listTeachers } from "@/app/api/teachers/services/teacher.service";
import { getClassList } from "@/app/api/classes/Services/classes.services";
import { getSubjectList } from "@/app/api/subjects/Services/subjects.services";
import { findAcademicYear } from "@/app/api/academicYears/services/academicyear.services";

/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     tags: [Dashboard]
 *     summary: Admin dashboard snapshot
 *     description: Returns school-wide counts, the newest students, and academic years in one request.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminDashboardResponse'
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

    const [students, teachers, classes, subjects, academicYears] =
      await Promise.all([
        listStudents({ page: 1, limit: 5 }, auth),
        listTeachers({ page: 1, limit: 1 }),
        getClassList({ page: 1, limit: 1 }),
        getSubjectList({ page: 1, limit: 1 }, auth),
        findAcademicYear({ page: 1, limit: 20 }),
      ]);

    return NextResponse.json({
      counts: {
        students: students.pagination.total,
        teachers: teachers.pagination.total,
        classes: classes.pagination.total,
        subjects: subjects.pagination.total,
      },
      recentStudents: students.data.map(toStudentSummary),
      academicYears: academicYears.data,
    });
  } catch (error) {
    return handleError(error);
  }
});
