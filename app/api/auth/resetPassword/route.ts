import { NextResponse } from "next/server";
import { resetPasswordSchema } from "../authSchemas/schemas";
import { resetPassword } from "../services/auth.service";
import { createRouteHandler } from "@/app/utils/create-route-handles";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/auth/resetPassword:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password
 *     description: Reset password using a token from forgot password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResetPasswordResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(resetPasswordSchema, async (request, body) => {
  try {
    const result = await resetPassword(body.token, body.newPassword);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
});
