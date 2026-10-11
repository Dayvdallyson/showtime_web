/** Converte uma posição acumulada (pode ser negativa ou maior que o total) num índice válido. */
export function wrapIndex(position: number, total: number) {
  return ((position % total) + total) % total
}

/**
 * Menor número de passos para ir de `from` até `to` num anel de `total` itens.
 * Positivo gira para a frente, negativo para trás; no empate, gira para a frente.
 */
export function shortestSteps(from: number, to: number, total: number) {
  const forward = wrapIndex(to - from, total)
  return forward > total / 2 ? forward - total : forward
}
