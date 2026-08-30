import { verifyToken, type JwtPayload } from "@/app/api/auth/services/jwt";

export { assertSelf } from "./authorize";

export class AuthError extends Error {
  status = 401 as const;

  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

const AUTH_SUB_HEADER = "x-auth-sub";
const AUTH_ROLE_HEADER = "x-auth-role";
const AUTH_USERNAME_HEADER = "x-auth-username";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const accessToken = header.slice("Bearer ".length).trim();
  return accessToken || null;
}

export function getAuthPayloadFromHeaders(request: Request): JwtPayload | null {
  const sub = request.headers.get(AUTH_SUB_HEADER);
  const role = request.headers.get(AUTH_ROLE_HEADER);
  const username = request.headers.get(AUTH_USERNAME_HEADER);

  if (!sub || !role || !username) {
    return null;
  }

  return { sub, role, username };
}

export async function verifyBearerToken(request: Request): Promise<JwtPayload> {
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

export async function getAuthPayload(request: Request): Promise<JwtPayload> {
  const fromHeaders = getAuthPayloadFromHeaders(request);
  if (fromHeaders) {
    return fromHeaders;
  }

  return verifyBearerToken(request);
}

export async function isAuthenticated(request: Request): Promise<boolean> {
  try {
    await verifyBearerToken(request);
    return true;
  } catch {
    return false;
  }
}

export const AUTH_HEADER_NAMES = {
  sub: AUTH_SUB_HEADER,
  role: AUTH_ROLE_HEADER,
  username: AUTH_USERNAME_HEADER,
} as const;
