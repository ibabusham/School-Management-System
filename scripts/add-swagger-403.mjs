import fs from "fs";
import { execSync } from "child_process";

const forbidden = ` *       403:
 *         description: Forbidden — insufficient role or out-of-scope access
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
`;

const files = execSync("grep -rl BearerAuth app/api --include=route.ts", {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);

const authBlock =
  /(\*       401:[\s\S]*?\*               \$ref: '#\/components\/schemas\/ErrorResponse'\n)/g;

function insertForbidden(content) {
  return content.replace(authBlock, (match, block, offset, full) => {
    const after = full.slice(offset + match.length);
    if (after.startsWith(" *       403:")) {
      return match;
    }
    return `${block}${forbidden}`;
  });
}

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const updated = insertForbidden(content);
  if (updated !== content) {
    fs.writeFileSync(file, updated);
    console.log("updated", file);
  }
}
