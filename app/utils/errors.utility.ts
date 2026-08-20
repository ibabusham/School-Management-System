import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number =500;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const message = firstIssue?.message ?? "Validation error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}