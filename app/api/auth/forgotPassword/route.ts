import { createRouteHandler } from "@/app/utils/create-route-handles";
import { forgotPasswordSchema } from "../authSchemas/schemas";
import { NextResponse } from "next/server";
import { forgotPassword } from "../services/auth.service";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/auth/forgotPassword:
 *   post:
 *     tags: [Auth]
 *     summary: Forgot password
 *     description: Forgot password
 *     requestBody:
 *       required: true
 *       content:       
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForgotPasswordResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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

export const POST = createRouteHandler(forgotPasswordSchema, async (request, body) => {
  try {
    const result = await forgotPassword(body.email);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
});