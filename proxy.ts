import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_HEADER_NAMES,
  verifyBearerToken,
} from "./app/api/auth/services/requireAuth";
import {
  isPublicRoute,
  isRoleAllowed,
  matchPolicy,
} from "./app/api/auth/services/proxy-policies";

export const config = {
  matcher: ["/api/:path*"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  let payload;
  try {
    payload = await verifyBearerToken(request);
  } catch {
    return NextResponse.json(
      { error: "Unauthorized or missing token" },
      { status: 401 }
    );
  }

  const policy = matchPolicy(request.method, pathname);
  if (!policy) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (!isRoleAllowed(payload.role, policy)) {
    return NextResponse.json(
      { error: "Forbidden — insufficient role" },
      { status: 403 }
    );
  }

  const headers = new Headers(request.headers);
  headers.set(AUTH_HEADER_NAMES.sub, payload.sub);
  headers.set(AUTH_HEADER_NAMES.role, payload.role);
  headers.set(AUTH_HEADER_NAMES.username, payload.username);

  return NextResponse.next({
    request: { headers },
  });
}
