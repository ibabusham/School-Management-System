import { createSwaggerSpec } from "next-swagger-doc";
import { swaggerComponentSchemas } from "./swagger/schemas";

const forbiddenResponse = {
  description:
    "Forbidden — authenticated but insufficient role, self-access violation, or out-of-scope resource",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
};

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Shield's School API",
        version: "0.1.0",
        description: [
          "REST API for auth, students, teachers, classes, subjects, academic years, terms, exams, assignments, lessons, learning progress, and attendance.",
          "",
          "**Roles (JWT `role` claim):**",
          "- **ADMIN** — full access to all endpoints",
          "- **TEACHER** — scoped to subjects where `Subjects.teacherId` matches the token `sub`; may read class performance and students in those classes",
          "- **STUDENT** — self-service only: own profile, learning progress, and read-only academic calendar (years/terms)",
          "",
          "Protected routes return **401** when the Bearer token is missing or invalid (enforced in `proxy.ts`).",
          "**403** may come from the proxy (JWT valid but role not allowed for that path/method) or from services (role allowed but resource out of scope, e.g. teacher accessing another teacher's subject).",
        ].join("\n"),
      },
      tags: [
        {
          name: "Auth",
          description:
            "Public login/refresh/password-reset. `changePassword` requires a valid Bearer token (any role; updates the token bearer only).",
        },
        {
          name: "Students",
          description:
            "**ADMIN:** list/create/update/delete. **TEACHER:** list students in classes linked to the teacher's subjects; get student by id in that same scope. **STUDENT:** get own profile; read own learning progress and notes (not create/update/delete notes).",
        },
        {
          name: "Teachers",
          description:
            "**ADMIN:** list/create/delete; get/update any teacher. **TEACHER:** get/update own profile only. **STUDENT:** no access.",
        },
        {
          name: "Classes",
          description:
            "**ADMIN:** full CRUD, assign/unassign students. **TEACHER:** get class performance only when the class has one of the teacher's subjects. **STUDENT:** no access.",
        },
        {
          name: "Subjects",
          description:
            "**ADMIN:** full CRUD and assign class/teacher. **TEACHER:** list own subjects; get by id when `teacherId` matches token `sub`. **STUDENT:** no access.",
        },
        {
          name: "Academic Years",
          description:
            "**ADMIN:** create/update/delete. **TEACHER** and **STUDENT:** read-only list and get by id.",
        },
        {
          name: "Terms",
          description:
            "**ADMIN:** create/update/delete. **TEACHER** and **STUDENT:** read-only list and get by id.",
        },
        {
          name: "Exams",
          description:
            "**ADMIN** and **TEACHER** (own subjects): CRUD, mark submissions, list taken/missing. **STUDENT:** no access.",
        },
        {
          name: "Assignments",
          description:
            "**ADMIN** and **TEACHER** (own subjects): CRUD, mark submissions, list taken/missing. **STUDENT:** no access.",
        },
        {
          name: "Lessons",
          description:
            "**ADMIN** and **TEACHER** (own subjects): CRUD. **STUDENT:** no access.",
        },
        {
          name: "Attendance",
          description:
            "**ADMIN** and **TEACHER** (own subjects): CRUD; list is filtered to the teacher's subjects. **STUDENT:** no access.",
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description:
              "Access token from POST /api/auth/login. Payload includes `sub` (user id) and `role` (`ADMIN` | `TEACHER` | `STUDENT`).",
          },
        },
        responses: {
          Forbidden: forbiddenResponse,
        },
        schemas: swaggerComponentSchemas,
      },
      security: [],
    },
  });
  return spec;
};
