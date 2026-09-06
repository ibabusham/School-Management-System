import { verifyToken, type JwtPayload } from "@/app/api/auth/services/jwt";
import { AppError } from "@/app/utils/errors.utility";

// Thrown when the request has no valid access token
export class AuthError extends Error {
  status = 401 as const;

  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const accessToken = header.slice("Bearer ".length).trim();
  return accessToken || null;
}

// Reads `Authorization: Bearer <accessToken>`, verifies the JWT, and returns its payload.
export async function getAuthPayload(request: Request): Promise<JwtPayload> {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    throw new AuthError("Unauthorized or missing token");
  }

  try {
    return await verifyToken(accessToken, "ACCESS");
  } catch {
    throw new AuthError("Unauthorized or missing token");
  }
}

export function assertStudentAccess(payload: JwtPayload, studentId: string) {
  if (payload.role === "STUDENT" && payload.sub !== studentId) {
    throw new AppError("You can only access your own learning progress", 403);
  }
}

export function assertTeacherOrAdmin(payload: JwtPayload) {
  if (payload.role !== "TEACHER" && payload.role !== "ADMIN") {
    throw new AppError("Teacher or admin access required", 403);
  }
}

// Used by proxy.ts — returns true when the token is valid.
export async function isAuthenticated(request: Request): Promise<JwtPayload | boolean> {
  try {
    await getAuthPayload(request);
    return true;
  } catch {
    return false;
  }
}
