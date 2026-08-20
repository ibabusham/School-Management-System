import { z } from "zod";

/** Convert a Zod schema into an OpenAPI 3.0 Schema Object. */
export function zodToOpenApiSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema, {
    target: "openapi-3.0",
    unrepresentable: "any",
  }) as Record<string, unknown>;
}
