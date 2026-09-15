export function normalizePlaceName(value: string) {
  return value.trim().replace(/\s+/g, "").replace(/臺/g, "台");
}

export function stripAdministrativeSuffix(value: string) {
  return value.replace(
    /(特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|自治州|地区|新区|林区|盟|省|市|区|县)$/,
    "",
  );
}

export function placeNameMatches(answer: string, targets: readonly string[]) {
  const candidate = normalizePlaceName(answer);
  if (!candidate) return false;

  return targets.some((target) => {
    const normalizedTarget = normalizePlaceName(target);
    return (
      candidate === normalizedTarget ||
      candidate === stripAdministrativeSuffix(normalizedTarget)
    );
  });
}
