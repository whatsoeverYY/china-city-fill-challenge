export function setsEqual<T>(left: ReadonlySet<T>, right: ReadonlySet<T>) {
  return left.size === right.size && Array.from(left).every((item) => right.has(item));
}
