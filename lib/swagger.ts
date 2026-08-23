import { createSwaggerSpec } from "next-swagger-doc";
import { swaggerComponentSchemas } from "./swagger/schemas";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "School Management System API",
        version: "0.1.0",
        description:
          "REST API for auth, students, teachers, classes, subjects, and academic years.",
      },
      tags: [
        { name: "Auth", description: "Login, tokens, and password management" },
        { name: "Students", description: "Student CRUD and listing" },
        { name: "Teachers", description: "Teacher CRUD and listing" },
        { name: "Classes", description: "Class CRUD and listing" },
        { name: "Subjects", description: "Subject CRUD and listing" },
        { name: "Academic Years", description: "Academic Year CRUD and listing" },
        { name: "Terms", description: "Term CRUD and listing" },
        { name: "Exams", description: "Exam CRUD and listing" },
       
    
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Access token from POST /api/auth/login",
          },
        },
        schemas: swaggerComponentSchemas,
      },
      security: [],
    },
  });
  return spec;
};
