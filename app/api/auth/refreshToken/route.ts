import { refreshTokenSchema } from "@/app/api/auth/authSchemas/schemas";
import { handleError } from "@/app/utils/errors.utility";
import { refresh } from "../services/auth.service";
import { NextResponse } from "next/server";
import { createRouteHandler } from "@/app/utils/create-route-handles";

/**
 * @swagger
 * /api/auth/refreshToken:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new token pair
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: New token pair
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(refreshTokenSchema, async (request, body) => {
  try {
    const { accessToken, refreshToken } = await refresh(body.refreshToken);

    return NextResponse.json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return handleError(error);
  }
});
