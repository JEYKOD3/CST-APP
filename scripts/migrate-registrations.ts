import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    DO $$ BEGIN
      CREATE TYPE registration_status AS ENUM ('pending_review', 'approved', 'rejected');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS registrations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES players(id),
      parent_user_id uuid NOT NULL REFERENCES app_users(id),
      season text NOT NULL,
      status registration_status NOT NULL DEFAULT 'pending_review',
      e_transfer_reference text NOT NULL,
      proof_url text,
      proof_file_name text,
      parent_notes text,
      reviewed_by_user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
      reviewed_at timestamp,
      admin_notes text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `;

  console.log("registrations migration ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
