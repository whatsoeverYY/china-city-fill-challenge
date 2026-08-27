import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const compatibilityMigrationUrl = new URL(
  "../supabase/migrations/202608270004_clear_progress_schema_compatibility.sql",
  import.meta.url,
);
const setupUrl = new URL("../supabase/SETUP.md", import.meta.url);

test("the clear-progress migration preserves the newest stored schema version", async () => {
  const sql = await readFile(compatibilityMigrationUrl, "utf8");

  assert.match(sql, /select progress\.schema_version[\s\S]*for update;/i);
  assert.match(
    sql,
    /schema_version\s*=\s*greatest\(progress\.schema_version, excluded\.schema_version\)/i,
  );
  assert.match(
    sql,
    /to_jsonb\(greatest\(progress\.schema_version, excluded\.schema_version\)\)/i,
  );
  assert.doesNotMatch(sql, /set\s+schema_version\s*=\s*1\b/i);
});

test("Supabase setup includes the schema-compatibility migration", async () => {
  const setup = await readFile(setupUrl, "utf8");
  assert.match(
    setup,
    /202608270004_clear_progress_schema_compatibility\.sql/,
  );
});
