import { NextResponse } from "next/server";
import { loginSchema } from "@/app/api/auth/authSchemas/schemas";
import { login } from "../services/auth.service";
import { handleError } from "@/app/utils/errors.utility";
import { createRouteHandler } from "@/app/utils/create-route-handles";

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in
 *     description: Authenticate with username and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(loginSchema, async (request, body) => {
  try {
    const { username, password } = body;

    const { accessToken, refreshToken, user } = await login(username, password);
    return NextResponse.json({
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    return handleError(error);
  }
});
