import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client-runtime-utils";

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
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
       
        const fields = error.meta?.target;
        const fieldList = Array.isArray(fields) ? fields.join(", ") : "field";
        return NextResponse.json(
          { error: `A record with this ${fieldList} already exists` },
          { status: 409 }
        );
      }
      case "P2003": {
      
        return NextResponse.json(
          { error: "Related record not found or cannot be deleted" },
          { status: 400 }
        );
      }
      case "P2025": {
      
        return NextResponse.json(
          { error: "Record not found" },
          { status: 404 }
        );
      }
      default:
        break;
    }
  }

  if (error instanceof PrismaClientValidationError) {
    return NextResponse.json(
      { error: "Invalid data sent to database" },
      { status: 400 }
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  
 if (process.env.NODE_ENV !== "production") {
  console.error(error);
 }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}