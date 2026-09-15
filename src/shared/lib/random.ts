export function shuffleWithRandom<T>(
  values: readonly T[],
  nextRandom: () => number,
) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(nextRandom() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function deterministicShuffle(values: readonly string[], seed: string) {
  let state = Number(seed) || 1;
  return shuffleWithRandom(values, () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  });
}

export function randomShuffle<T>(values: readonly T[]) {
  return shuffleWithRandom(values, Math.random);
}
