export function wrapIndex(position: number, total: number) {
  return ((position % total) + total) % total
}

export function shortestSteps(from: number, to: number, total: number) {
  const forward = wrapIndex(to - from, total)
  return forward > total / 2 ? forward - total : forward
}
