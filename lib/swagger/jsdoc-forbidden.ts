/**
 * Copy into route JSDoc `responses` after the 401 block on protected endpoints.
 *
 * @example
 *  *       403:
 *  *         description: Forbidden — insufficient role or out-of-scope access
 *  *         content:
 *  *           application/json:
 *  *             schema:
 *  *               $ref: '#/components/schemas/ErrorResponse'
 */
export const FORBIDDEN_RESPONSE_JSDOC = ` *       403:
 *         description: Forbidden — insufficient role or out-of-scope access
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'`;
