import { describe, expect, test } from "vitest"

import {
  shortestSteps,
  wrapIndex,
} from "@/components/carousel-3d/carousel-math"

describe("wrapIndex", () => {
  test("mantém posições dentro do intervalo", () => {
    expect(wrapIndex(0, 5)).toBe(0)
    expect(wrapIndex(4, 5)).toBe(4)
  })

  test("dá a volta para a frente", () => {
    expect(wrapIndex(5, 5)).toBe(0)
    expect(wrapIndex(12, 5)).toBe(2)
  })

  test("dá a volta para trás com posições negativas", () => {
    expect(wrapIndex(-1, 5)).toBe(4)
    expect(wrapIndex(-6, 5)).toBe(4)
  })
})

describe("shortestSteps", () => {
  test("é zero para o mesmo índice", () => {
    expect(shortestSteps(2, 2, 5)).toBe(0)
  })

  test("gira para a frente quando é o caminho mais curto", () => {
    expect(shortestSteps(0, 2, 5)).toBe(2)
  })

  test("gira para trás quando é o caminho mais curto", () => {
    expect(shortestSteps(0, 4, 5)).toBe(-1)
    expect(shortestSteps(1, 4, 5)).toBe(-2)
  })

  test("atravessa o fim do anel", () => {
    expect(shortestSteps(4, 0, 5)).toBe(1)
  })

  test("no empate, gira para a frente", () => {
    expect(shortestSteps(0, 2, 4)).toBe(2)
  })
})
