import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { normalizeUserRoles } from "../src/lib/role-sync";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");

  const db = drizzle(neon(process.env.DATABASE_URL), { schema });
  const users = await db.select({ id: schema.appUsers.id }).from(schema.appUsers);

  for (const { id } of users) {
    await normalizeUserRoles(id);
  }

  console.log(`Normalized roles for ${users.length} user(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
