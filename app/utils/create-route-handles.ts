import { NextRequest } from "next/server";
import { z } from "zod";
import { handleError } from "./errors.utility";

type RouteContext<T = Record<string, string>> = {
  params: Promise<T>;
};

// No schema
export function createRouteHandler(
  schema: null,
  handler: (
    request: NextRequest,
    body: undefined,
    context: RouteContext
  ) => Promise<Response>
): (
  request: NextRequest,
  context: RouteContext
) => Promise<Response>;

// With schema
export function createRouteHandler<S extends z.ZodType>(
  schema: S,
  handler: (
    request: NextRequest,
    body: z.output<S>,
    context: RouteContext
  ) => Promise<Response>
): (
  request: NextRequest,
  context: RouteContext
) => Promise<Response>;

// Implementation
export function createRouteHandler<S extends z.ZodType>(
  schema: S | null,
  handler: (
    request: NextRequest,
    body: z.output<S> | undefined,
    context: RouteContext
  ) => Promise<Response>
) {
  return async (
    request: NextRequest,
    context: RouteContext
  ): Promise<Response> => {
    try {
      if (schema === null) {
        return await handler(request, undefined, context);
      }

      const body = await request.json();
      const parsed = schema.parse(body);

      return await handler(request, parsed, context);
    } catch (error) {
      return handleError(error);
    }
  };
}