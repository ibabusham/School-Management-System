/**
 * When adding a protected API route, add a policy entry here first.
 * Policies are matched top-to-bottom; put more specific patterns first.
 */
import { Role } from "@/prisma/generated/client";

export type ProxyPolicy = {
  methods: string[];
  pattern: RegExp;
  roles: Role[];
};

const ALL_ROLES = [Role.ADMIN, Role.TEACHER, Role.STUDENT] as const;
const ADMIN_ONLY = [Role.ADMIN] as const;
const TEACHER_OR_ADMIN = [Role.TEACHER, Role.ADMIN] as const;

const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/refreshToken",
  "/api/auth/forgotPassword",
  "/api/auth/resetPassword",
  "/api/auth/logout",
] as const;

export const PROXY_POLICIES: ProxyPolicy[] = [
  // --- Mixed method rules (most specific first) ---
  {
    methods: ["PATCH", "DELETE"],
    pattern: /^\/api\/students\/[^/]+\/learningProgress\/notes\/[^/]+$/,
    roles: [...TEACHER_OR_ADMIN],
  },
  {
    methods: ["GET"],
    pattern: /^\/api\/students\/[^/]+\/learningProgress\/notes\/[^/]+$/,
    roles: [...ALL_ROLES],
  },
  {
    methods: ["POST"],
    pattern: /^\/api\/students\/[^/]+\/learningProgress\/notes$/,
    roles: [...TEACHER_OR_ADMIN],
  },
  {
    methods: ["GET"],
    pattern: /^\/api\/students\/[^/]+\/learningProgress\/notes$/,
    roles: [...ALL_ROLES],
  },
  {
    methods: ["GET"],
    pattern: /^\/api\/students\/[^/]+\/learningProgress$/,
    roles: [...ALL_ROLES],
  },

  // --- Teacher-scoped academic content ---
  {
    methods: ["GET", "POST", "PATCH", "DELETE"],
    pattern: /^\/api\/exams(\/|$)/,
    roles: [...TEACHER_OR_ADMIN],
  },
  {
    methods: ["GET", "POST", "PATCH", "DELETE"],
    pattern: /^\/api\/assignments(\/|$)/,
    roles: [...TEACHER_OR_ADMIN],
  },
  {
    methods: ["GET", "POST", "PATCH", "DELETE"],
    pattern: /^\/api\/lessons(\/|$)/,
    roles: [...TEACHER_OR_ADMIN],
  },
  {
    methods: ["GET", "POST", "PATCH", "DELETE"],
    pattern: /^\/api\/attendance(\/|$)/,
    roles: [...TEACHER_OR_ADMIN],
  },

  // --- Subjects ---
  {
    methods: ["GET"],
    pattern: /^\/api\/subjects\/[^/]+$/,
    roles: [...TEACHER_OR_ADMIN],
  },
  {
    methods: ["GET"],
    pattern: /^\/api\/subjects$/,
    roles: [...TEACHER_OR_ADMIN],
  },
  {
    methods: ["POST"],
    pattern: /^\/api\/subjects$/,
    roles: [...ADMIN_ONLY],
  },
  {
    methods: ["PATCH"],
    pattern: /^\/api\/subjects\/[^/]+\/(class|teacher)$/,
    roles: [...ADMIN_ONLY],
  },
  {
    methods: ["PATCH", "DELETE"],
    pattern: /^\/api\/subjects\/[^/]+$/,
    roles: [...ADMIN_ONLY],
  },

  // --- Students ---
  {
    methods: ["GET"],
    pattern: /^\/api\/students\/[^/]+$/,
    roles: [...ALL_ROLES],
  },
  {
    methods: ["PATCH", "DELETE"],
    pattern: /^\/api\/students\/[^/]+$/,
    roles: [...ADMIN_ONLY],
  },
  {
    methods: ["GET"],
    pattern: /^\/api\/students$/,
    roles: [...TEACHER_OR_ADMIN],
  },
  {
    methods: ["POST"],
    pattern: /^\/api\/students$/,
    roles: [...ADMIN_ONLY],
  },

  // --- Teachers ---
  {
    methods: ["GET"],
    pattern: /^\/api\/teachers\/[^/]+$/,
    roles: [...ALL_ROLES],
  },
  {
    methods: ["PATCH"],
    pattern: /^\/api\/teachers\/[^/]+$/,
    roles: [...ALL_ROLES],
  },
  {
    methods: ["DELETE"],
    pattern: /^\/api\/teachers\/[^/]+$/,
    roles: [...ADMIN_ONLY],
  },
  {
    methods: ["GET", "POST"],
    pattern: /^\/api\/teachers$/,
    roles: [...ADMIN_ONLY],
  },

  // --- Classes ---
  {
    methods: ["GET"],
    pattern: /^\/api\/classes\/[^/]+\/performance$/,
    roles: [...TEACHER_OR_ADMIN],
  },
  {
    methods: ["POST"],
    pattern: /^\/api\/classes\/[^/]+\/students$/,
    roles: [...ADMIN_ONLY],
  },
  {
    methods: ["DELETE"],
    pattern: /^\/api\/classes\/[^/]+\/students\/[^/]+$/,
    roles: [...ADMIN_ONLY],
  },
  {
    methods: ["GET", "PATCH", "DELETE"],
    pattern: /^\/api\/classes\/[^/]+$/,
    roles: [...ADMIN_ONLY],
  },
  {
    methods: ["GET", "POST"],
    pattern: /^\/api\/classes$/,
    roles: [...ADMIN_ONLY],
  },

  // --- Academic calendar ---
  {
    methods: ["GET"],
    pattern: /^\/api\/academicYears\/[^/]+$/,
    roles: [...ALL_ROLES],
  },
  {
    methods: ["PATCH", "DELETE"],
    pattern: /^\/api\/academicYears\/[^/]+$/,
    roles: [...ADMIN_ONLY],
  },
  {
    methods: ["GET"],
    pattern: /^\/api\/academicYears$/,
    roles: [...ALL_ROLES],
  },
  {
    methods: ["POST"],
    pattern: /^\/api\/academicYears$/,
    roles: [...ADMIN_ONLY],
  },
  {
    methods: ["GET"],
    pattern: /^\/api\/terms\/[^/]+$/,
    roles: [...ALL_ROLES],
  },
  {
    methods: ["PATCH", "DELETE"],
    pattern: /^\/api\/terms\/[^/]+$/,
    roles: [...ADMIN_ONLY],
  },
  {
    methods: ["GET"],
    pattern: /^\/api\/terms$/,
    roles: [...ALL_ROLES],
  },
  {
    methods: ["POST"],
    pattern: /^\/api\/terms$/,
    roles: [...ADMIN_ONLY],
  },

  // --- Auth ---
  {
    methods: ["POST"],
    pattern: /^\/api\/auth\/changePassword$/,
    roles: [...ALL_ROLES],
  },
];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function matchPolicy(
  method: string,
  pathname: string
): ProxyPolicy | null {
  const normalizedMethod = method.toUpperCase();

  for (const policy of PROXY_POLICIES) {
    if (
      policy.methods.includes(normalizedMethod) &&
      policy.pattern.test(pathname)
    ) {
      return policy;
    }
  }

  return null;
}

export function isRoleAllowed(role: string, policy: ProxyPolicy): boolean {
  return policy.roles.includes(role as Role);
}
