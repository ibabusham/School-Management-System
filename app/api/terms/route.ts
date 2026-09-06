import { createRouteHandler } from "@/app/utils/create-route-handles";
import { NextResponse } from "next/server";
import { createTerm, getTerms } from "./services/terms.services";
import { createTermSchema, termListQuerySchema } from "./schemas";
import { TERM_CREATED_MESSAGE } from "@/app/api/shared/operation-messages";
import { getAuthPayload } from "@/app/api/auth/services/requireAuth";
import { handleError } from "@/app/utils/errors.utility";

/**
 * @swagger
 * /api/terms:
 *   get:
 *     tags: [Terms]
 *     summary: List terms
 *     description: Returns paginated terms, optionally filtered by search query
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by term name (partial match)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of terms
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TermListResponse'
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
 *       403:
 *         description: Forbidden — insufficient role or out-of-scope access
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const GET = createRouteHandler(null, async (request) => {
  try {
    const auth = await getAuthPayload(request);

    const queryParams = request.nextUrl.searchParams;
    const parsed = termListQuerySchema.safeParse({
      page: queryParams.get("page") ?? undefined,
      limit: queryParams.get("limit") ?? undefined,
      search: queryParams.get("search") ?? undefined,
    });

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await getTerms(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
});

/**
 * @swagger
 * /api/terms:
 *   post:
 *     tags: [Terms]
 *     summary: Create term
 *     description: Creates a term linked to an academic year
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTermRequest'
 *           example:
 *             termName: "Fall Semester"
 *             startDate: "2025-09-01"
 *             endDate: "2025-12-15"
 *             yearId: "d898f209-7413-479d-84e4-724fd8f46b0a"
 *     responses:
 *       201:
 *         description: Term created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateTermResponse'
 *       400:
 *         description:  Validation error or maximum of 2 terms per academic year
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
 *       403:
 *         description: Forbidden — insufficient role or out-of-scope access
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Academic year not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const POST = createRouteHandler(createTermSchema, async (request, body) => {
  try {
    const auth = await getAuthPayload(request);

    const term = await createTerm(body);
    return NextResponse.json(
      {
        message: TERM_CREATED_MESSAGE,
        term,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
});
