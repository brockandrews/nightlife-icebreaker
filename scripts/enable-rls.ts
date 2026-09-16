import { prisma } from "../src/lib/prisma";

async function enableRLS() {
  console.log("Checking and enabling Row Level Security (RLS) on all public tables...");

  const tables: { tablename: string; rowsecurity: boolean }[] = await prisma.$queryRaw`
    SELECT
      tablename,
      rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;

  let updatedCount = 0;

  for (const t of tables) {
    if (!t.rowsecurity) {
      console.log(`Enabling RLS on table: "public"."${t.tablename}"...`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "public"."${t.tablename}" ENABLE ROW LEVEL SECURITY;`);
      updatedCount++;
    } else {
      console.log(`✓ RLS already enabled on: "public"."${t.tablename}"`);
    }
  }

  // Optional read policy for ThemePack public template catalog
  try {
    const existingPolicy: any[] = await prisma.$queryRaw`
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'ThemePack' AND policyname = 'Allow public read-only for ThemePack';
    `;
    if (existingPolicy.length === 0) {
      console.log("Adding public read-only policy for \"ThemePack\"...");
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "Allow public read-only for ThemePack"
        ON "public"."ThemePack"
        FOR SELECT
        USING (true);
      `);
    }
  } catch (err) {
    console.warn("Notice: Policy creation:", err);
  }

  console.log(`\nRLS setup complete. ${updatedCount} table(s) updated.`);

  // Verify
  const verifiedTables: any[] = await prisma.$queryRaw`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;

  console.log("\nCurrent Table RLS Status in Supabase:");
  for (const t of verifiedTables) {
    console.log(` - ${t.tablename}: rowsecurity = ${t.rowsecurity}`);
  }
}

enableRLS()
  .catch((e) => {
    console.error("Failed to enable RLS:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
