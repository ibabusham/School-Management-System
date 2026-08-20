import { jwtVerify, SignJWT } from "jose";

export type JwtPayload = {
  sub: string;
  username: string;
  role: string;
};

export type TokenType = "ACCESS" | "REFRESH" | "RESET";

type SecretEnvName =
  | "JWT_ACCESS_SECRET"
  | "JWT_REFRESH_SECRET"
  | "JWT_RESET_SECRET";

function getSecret(envName: SecretEnvName) {
  const secret = process.env[envName];
  if (!secret) {
    throw new Error(`${envName} is not set`);
  }
  return new TextEncoder().encode(secret);
}

function getSecretForType(type: TokenType): SecretEnvName {
  if (type === "ACCESS") return "JWT_ACCESS_SECRET";
  if (type === "REFRESH") return "JWT_REFRESH_SECRET";
  return "JWT_RESET_SECRET";
}

function getExpiration(type: TokenType) {
  if (type === "ACCESS") return "15m";
  if (type === "REFRESH") return "7d";
  return "15m";
}

export async function signToken(payload: JwtPayload, type: TokenType) {
  return new SignJWT({ username: payload.username, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(getExpiration(type))
    .sign(getSecret(getSecretForType(type)));
}

export async function verifyToken(token: string, type: TokenType) {
  const { payload } = await jwtVerify(
    token,
    getSecret(getSecretForType(type)),
  );

  if (
    !payload.sub ||
    typeof payload.username !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    sub: payload.sub,
    username: payload.username,
    role: payload.role,
  } satisfies JwtPayload;
}
