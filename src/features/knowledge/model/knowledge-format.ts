export function compactSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "").replace(/臺/g, "台");
}

export function matchesSearch(
  query: string,
  ...values: Array<string | number | undefined>
) {
  if (!query) return true;
  return values.some((value) =>
    compactSearch(String(value ?? "")).includes(query)
  );
}

export function plainPlaceName(value: string) {
  return value.replace(
    /(壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区|省|市)$/u,
    "",
  );
}
