import { handleError } from "@/app/utils/errors.utility";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { logoutSchema } from "../authSchemas/schemas";
import { NextResponse } from "next/server";
import { logout } from "../services/auth.service";

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out
 *     description: Log out the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(logoutSchema, async (request, body) => {
  try {
    const result = await logout(body.refreshToken);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
});