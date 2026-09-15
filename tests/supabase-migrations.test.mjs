import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const compatibilityMigrationUrl = new URL(
  "../supabase/migrations/202608270004_clear_progress_schema_compatibility.sql",
  import.meta.url,
);
const gauntletSummaryMigrationUrl = new URL(
  "../supabase/migrations/202609150001_update_gauntlet_level_summary.sql",
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

test("gauntlet summaries exclude removed levels and keep 23 active levels", async () => {
  const sql = await readFile(gauntletSummaryMigrationUrl, "utf8");
  const compactSql = sql.replace(/\s+/g, " ");

  assert.match(sql, /count\(distinct entry\.value\)/i);
  assert.match(sql, /china-city-fill-gauntlet-progress-v6/);
  assert.match(sql, /china-city-fill-gauntlet-progress-v5/);
  assert.match(
    compactSql,
    /if uses_current_levels then[\s\S]*'1', '2', '3'[\s\S]*'21', '22', '23'/i,
  );
  assert.match(
    compactSql,
    /else[\s\S]*'1', '2', '4'[\s\S]*'24', '25', '26'/i,
  );
});

test("Supabase setup includes the 23-level summary migration", async () => {
  const setup = await readFile(setupUrl, "utf8");
  assert.match(
    setup,
    /202609150001_update_gauntlet_level_summary\.sql/,
  );
});
