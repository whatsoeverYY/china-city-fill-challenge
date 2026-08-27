import assert from "node:assert/strict";
import test from "node:test";
import { resolveSupabaseConfig } from "../app/supabase-client.ts";

test("local development does not silently use production Supabase", () => {
  const config = resolveSupabaseConfig({ allowProductionFallback: false });
  assert.equal(config.url, "");
  assert.match(config.error, /本地开发未启用云存档/);
});

test("an explicit Supabase configuration must be complete", () => {
  const config = resolveSupabaseConfig({
    url: "https://example.supabase.co",
    allowProductionFallback: true,
  });
  assert.equal(config.url, "");
  assert.match(config.error, /必须同时配置/);
});

test("explicit Supabase settings override the production fallback", () => {
  const config = resolveSupabaseConfig({
    url: "https://example.supabase.co",
    publishableKey: "sb_publishable_test",
    allowProductionFallback: true,
  });
  assert.deepEqual(config, {
    url: "https://example.supabase.co",
    publishableKey: "sb_publishable_test",
    error: null,
  });
});
