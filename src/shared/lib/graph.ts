export function setsEqual<T>(left: ReadonlySet<T>, right: ReadonlySet<T>) {
  return left.size === right.size && Array.from(left).every((item) => right.has(item));
}

export function findShortestPath(
  start: string,
  end: string,
  adjacency: Readonly<Record<string, readonly string[]>>,
) {
  const queue: string[][] = [[start]];
  const visited = new Set([start]);

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const path = queue[queueIndex];
    const current = path[path.length - 1];
    if (current === end) return path;

    for (const neighbor of adjacency[current] ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push([...path, neighbor]);
    }
  }

  return [];
}
