import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { createTerm, getTerms } from "./services/terms.services";
import { createTermSchema, termListQuerySchema } from "./schemas";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/terms:
 *   get:
 *     tags: [Terms]
 *     summary: Get all terms
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Terms list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TermListResponse'
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
export const GET = createRouteHandler(termListQuerySchema, async (_request, body, _context) => {
    try {
        const terms = await getTerms(body);
        return NextResponse.json({
            data: terms.data,
            total: terms.total,
            page: terms.page,
            limit: terms.limit,
        });
    } catch (error) {
        return handleError(error);
    }
});

/**
 * @swagger
 * /api/terms:
 *   post:
 *     tags: [Terms]
 *     summary: Create a new term
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTermInput'
 *     responses:
 *       200:
 *         description: Term created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TermResponse'
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
export const POST = createRouteHandler(createTermSchema, async (_request, body, _context) => {
    try {
        const term = await createTerm(body);
        return NextResponse.json({ term });
    } catch (error) {
        return handleError(error);
    }
});   