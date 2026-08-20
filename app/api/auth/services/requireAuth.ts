import { verifyToken, type JwtPayload } from "@/app/api/auth/services/jwt";

// Thrown when the request has no valid access token
export class AuthError extends Error {
  status = 401 as const;

  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

// Reads `Authorization: Bearer <accessToken>`, verifies the JWT, and returns its payload.
// Call this at the start of protected route handlers.
export async function isAuthenticated(request: Request): Promise<JwtPayload | boolean> {
  const header = request.headers.get("authorization");
  
  if (!header?.startsWith("Bearer ")) {
   return false
  }

  const accessToken = header.slice("Bearer ".length).trim();

  if (!accessToken) {
   return false
  }

  try {
     await verifyToken(accessToken, "ACCESS");
     return true
  } catch {
   return false
  }
}
