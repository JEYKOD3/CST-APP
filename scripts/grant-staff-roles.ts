import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq } from "drizzle-orm";
import * as schema from "../src/db/schema";

async function main() {
  const email = "jeanemm@hotmail.ca";
  const roles = ["super_admin", "coach"] as const;

  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");

  const db = drizzle(neon(process.env.DATABASE_URL), { schema });
  const [user] = await db
    .select()
    .from(schema.appUsers)
    .where(eq(schema.appUsers.email, email))
    .limit(1);

  if (!user) {
    console.log(
      "No app user yet — sign in once on Vercel, then roles apply automatically.",
    );
    return;
  }

  for (const role of roles) {
    const [existing] = await db
      .select()
      .from(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.userId, user.id),
          eq(schema.userRoles.role, role),
        ),
      )
      .limit(1);
    if (!existing) {
      await db.insert(schema.userRoles).values({ userId: user.id, role });
    }
  }

  console.log(`Granted super_admin + coach to ${email}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
