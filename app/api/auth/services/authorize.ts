import { AppError } from "@/app/utils/errors.utility";
import type { JwtPayload } from "@/app/api/auth/services/jwt";

export { isAdmin, isStudent, isTeacher } from "./roles";

export function assertSelf(payload: JwtPayload, resourceUserId: string) {
  if (payload.sub !== resourceUserId) {
    throw new AppError("You can only access your own account", 403);
  }
}
