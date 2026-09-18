export function toggleNeighborCenterCode(
  currentCodes: ReadonlySet<string>,
  provinceCode: string,
) {
  const nextCodes = new Set(currentCodes);
  if (!nextCodes.has(provinceCode)) {
    nextCodes.add(provinceCode);
    return nextCodes;
  }
  if (nextCodes.size > 1) nextCodes.delete(provinceCode);
  return nextCodes;
}

export function collectNeighborProvinceCodes(
  centerCodes: ReadonlySet<string>,
  provinceNeighbors: Record<string, string[]>,
) {
  const neighborCodes = new Set<string>();
  centerCodes.forEach((centerCode) => {
    (provinceNeighbors[centerCode] ?? []).forEach((neighborCode) => {
      if (!centerCodes.has(neighborCode)) neighborCodes.add(neighborCode);
    });
  });
  return [...neighborCodes];
}
