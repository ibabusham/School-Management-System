import { createHash } from "crypto";
import { signToken, verifyToken, type TokenType } from "@/app/api/auth/services/jwt";
import { prisma } from "@/app/lib/prisma";
import { AppError } from "@/app/utils/errors.utility";
import { User } from "@/prisma/generated/client";
import { compare, hash } from "bcrypt";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function verifyTokenOrThrow(token: string, type: TokenType) {
  try {
    return await verifyToken(token, type);
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
}

function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function storeRefreshToken(userId: string, refreshToken: string) {
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
}

async function revokeRefreshToken(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashRefreshToken(refreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

async function assertRefreshTokenStored(refreshToken: string, userId: string) {
  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash: hashRefreshToken(refreshToken),
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!stored) {
    throw new AppError("Invalid or expired refresh token", 401);
  }
}

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  const passwordMatches = user
    ? await compare(password, user.password)
    : false;

  if (!user || !passwordMatches) {
    throw new AppError("Invalid username or password", 401);
  }

  if (!user.accountStatus) {
    throw new AppError("User is not active", 401);
  }

  const { accessToken, refreshToken } = await signTokens(user);

  return {
    accessToken,
    refreshToken,
    user: { ...user, password: undefined },
  };
}

export async function logout(refreshToken: string) {
  const payload = await verifyTokenOrThrow(refreshToken, "REFRESH");
  await assertRefreshTokenStored(refreshToken, payload.sub);
  await revokeRefreshToken(refreshToken);
  return { message: "Logged out successfully" };
}

export async function refresh(refreshToken: string) {
  const payload = await verifyTokenOrThrow(refreshToken, "REFRESH");
  const user = await findUserById(payload.sub);

  if (!user.accountStatus) {
    throw new AppError("User is not active", 401);
  }

  await assertRefreshTokenStored(refreshToken, user.id);
  await revokeRefreshToken(refreshToken);

  return signTokens(user);
}

export async function findUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

export async function findUserByEmail(email: string) {
  const student = await prisma.student.findFirst({
    where: { email, accountStatus: true },
    select: { id: true },
  });

  if (student) {
    return findUserById(student.id);
  }

  const teacher = await prisma.teacher.findFirst({
    where: { email, accountStatus: true },
    select: { id: true },
  });

  if (teacher) {
    return findUserById(teacher.id);
  }

  return null;
}

export async function findUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

export async function signTokens(user: User) {
  const tokenPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
  };

  const [accessToken, refreshToken] = await Promise.all([
    signToken(tokenPayload, "ACCESS"),
    signToken(tokenPayload, "REFRESH"),
  ]);

  await storeRefreshToken(user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
  };
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
) {
  const user = await findUserById(userId);
  const passwordMatches = await compare(oldPassword, user.password);

  if (!passwordMatches) {
    throw new AppError("Invalid old password", 401);
  }

  const hashedNewPassword = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNewPassword },
  });

  return { message: "Password changed successfully" };
}

export async function forgotPassword(email: string) {
  const user = await findUserByEmail(email);
  const message =
    "If an account exists for this email, a reset link has been sent.";

  if (!user) {
    return { message };
  }

  const token = await signToken(
    { sub: user.id, username: user.username, role: user.role },
    "RESET",
  );

  return { message, token };
}

export async function resetPassword(token: string, newPassword: string) {
  const payload = await verifyTokenOrThrow(token, "RESET");
  const user = await findUserById(payload.sub);
  const hashedNewPassword = await hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNewPassword },
  });

  return { message: "Password reset successfully" };
}
