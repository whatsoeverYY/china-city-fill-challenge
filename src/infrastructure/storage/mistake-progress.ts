import {
  normalizeMistakeList,
  type MistakeQuestion,
} from "../../domain/game/mistakes.ts";
import { GAUNTLET_MISTAKES_KEY } from "./progress-keys.ts";
import {
  latestProgressIso,
  progressScope,
  progressTimestamp,
  type SyncMeta,
} from "./progress-metadata.ts";
import type { ProgressSnapshot } from "./progress-snapshot.ts";

export function parseMistakeProgress(raw: string | null | undefined) {
  if (!raw) return [];
  try {
    return normalizeMistakeList(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

type MistakeEvent = {
  item: MistakeQuestion | null;
  time: number;
};

function mistakeEvent(
  snapshot: ProgressSnapshot,
  item: MistakeQuestion | undefined,
  id: string,
): MistakeEvent | null {
  const scope = progressScope(GAUNTLET_MISTAKES_KEY, id);
  const itemTime = progressTimestamp(
    snapshot.meta.scopes[scope] ?? snapshot.meta.keys[GAUNTLET_MISTAKES_KEY],
  );
  const resetTime = progressTimestamp(snapshot.meta.resets[scope]);
  if (item && itemTime >= resetTime) return { item, time: itemTime };
  if (resetTime) return { item: null, time: resetTime };
  return item ? { item, time: itemTime } : null;
}

function mistakeScopeIds(meta: SyncMeta) {
  const prefix = `${GAUNTLET_MISTAKES_KEY}:`;
  return [...Object.keys(meta.scopes), ...Object.keys(meta.resets)]
    .filter((scope) => scope.startsWith(prefix))
    .map((scope) => scope.slice(prefix.length));
}

export function mergeMistakeProgress(
  local: ProgressSnapshot,
  remote: ProgressSnapshot,
  mergedMeta: SyncMeta,
) {
  const localItems = new Map(
    parseMistakeProgress(local.values[GAUNTLET_MISTAKES_KEY]).map(
      (item) => [item.id, item],
    ),
  );
  const remoteItems = new Map(
    parseMistakeProgress(remote.values[GAUNTLET_MISTAKES_KEY]).map(
      (item) => [item.id, item],
    ),
  );
  const mergedItems: Array<{ item: MistakeQuestion; time: number }> = [];
  const ids = new Set([
    ...localItems.keys(),
    ...remoteItems.keys(),
    ...mistakeScopeIds(local.meta),
    ...mistakeScopeIds(remote.meta),
  ]);

  for (const id of ids) {
    const scope = progressScope(GAUNTLET_MISTAKES_KEY, id);
    const localEvent = mistakeEvent(local, localItems.get(id), id);
    const remoteEvent = mistakeEvent(remote, remoteItems.get(id), id);
    const resetAt = latestProgressIso(
      local.meta.resets[scope],
      remote.meta.resets[scope],
    );
    mergedMeta.scopes[scope] = latestProgressIso(
      local.meta.scopes[scope] ?? local.meta.keys[GAUNTLET_MISTAKES_KEY],
      remote.meta.scopes[scope] ?? remote.meta.keys[GAUNTLET_MISTAKES_KEY],
    );
    if (progressTimestamp(resetAt)) mergedMeta.resets[scope] = resetAt;

    const winner = !localEvent
      ? remoteEvent
      : !remoteEvent
        ? localEvent
        : localEvent.time === remoteEvent.time
          ? localEvent.item && remoteEvent.item
            ? localEvent.item.wrongCount >= remoteEvent.item.wrongCount
              ? localEvent
              : remoteEvent
            : localEvent.item ? remoteEvent : localEvent
          : localEvent.time > remoteEvent.time ? localEvent : remoteEvent;
    if (winner?.item) mergedItems.push(winner as { item: MistakeQuestion; time: number });
  }

  mergedItems.sort((left, right) =>
    left.time - right.time || left.item.id.localeCompare(right.item.id)
  );
  return JSON.stringify(normalizeMistakeList(
    mergedItems.map(({ item }) => item),
  ));
}
