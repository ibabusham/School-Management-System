import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { getClassPerformance } from "../../Services/classes.services";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/classes/{id}/performance:
 *   get:
 *     tags: [Classes]
 *     summary: Get class performance
 *     description: Returns performance metrics for a class by class id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Class id
 *     responses:
 *       200:
 *         description: Class performance found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassPerformanceResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Class or performance not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (_request, _body, context) => {
  try {
    const { id } = await context.params;
    const performance = await getClassPerformance(id);
    return NextResponse.json({ performance });
  } catch (error) {
    return handleError(error);
  }
});
