import { NextResponse } from "next/server";
import { changePassword } from "../services/auth.service";
import { verifyToken } from "../services/jwt";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { changePasswordSchema } from "../authSchemas/schemas";
import { AppError, handleError } from "@/app/utils/errors.utility";



/**
 * @swagger
 * /api/auth/changePassword:
 *   post:
 *     tags: [Auth]
 *     summary: Change password
 *     description: Change the password of the user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChangePasswordResponse'
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(changePasswordSchema, async (request, body) => {
  try {
    //middleware
    const header = request.headers.get("authorization");
    const accessToken = header?.startsWith("Bearer ")
      ? header.slice("Bearer ".length).trim()
      : "";

    if (!accessToken) {
      throw new AppError("Unauthorized or missing token", 401);
    }

    let payload;
    try {
      payload = await verifyToken(accessToken, "ACCESS");
    } catch {
      throw new AppError("Unauthorized or missing token", 401);
    }

    const result = await changePassword(
      payload.sub,
      body.oldPassword,
      body.newPassword
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
});
