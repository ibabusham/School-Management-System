import { verifyToken, type JwtPayload } from "@/app/api/auth/services/jwt";

export {
  assertStudentAccess,
  assertTeacherOrAdmin,
  assertLearningProgressReadAccess,
  assertProgressNoteCreateAccess,
  assertProgressNoteModifyAccess,
} from "./authorize";

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

export async function isAuthenticated(request: Request): Promise<JwtPayload | boolean> {
  try {
    await getAuthPayload(request);
    return true;
  } catch {
    return false;
  }
}
