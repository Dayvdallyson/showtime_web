import { z } from "zod"

export const TITLE_MAX_LENGTH = 200
export const GENRE_MAX_LENGTH = 50
export const MIN_YEAR = 1888
export const MAX_YEAR = 2100
export const DEFAULT_ACCENT = "#6366f1"

const HEX_COLOR = /^#[0-9a-f]{6}$/i
const FOUR_DIGITS = /^\d{4}$/

export const movieSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  genre: z.string(),
  year: z.int(),
  synopsis: z.string().nullable(),
  posterUrl: z.string().nullable(),
  accent: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const movieListSchema = z.object({
  data: z.array(movieSchema),
  meta: z.object({
    page: z.int(),
    pageSize: z.int(),
    total: z.int(),
  }),
})

export type Movie = z.infer<typeof movieSchema>
export type MovieList = z.infer<typeof movieListSchema>

export const movieFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe o título")
    .max(TITLE_MAX_LENGTH, `Use até ${TITLE_MAX_LENGTH} caracteres`),
  genre: z
    .string()
    .trim()
    .min(1, "Informe o gênero")
    .max(GENRE_MAX_LENGTH, `Use até ${GENRE_MAX_LENGTH} caracteres`),
  year: z
    .string()
    .trim()
    .regex(FOUR_DIGITS, "Informe o ano com 4 dígitos")
    .transform(Number)
    .pipe(
      z
        .int()
        .min(MIN_YEAR, `O ano mínimo é ${MIN_YEAR}`)
        .max(MAX_YEAR, `O ano máximo é ${MAX_YEAR}`)
    ),
  accent: z.string().regex(HEX_COLOR, "Use uma cor hex, ex.: #0ea5e9"),
})

export type MovieFormValues = z.input<typeof movieFormSchema>
export type MovieInput = z.output<typeof movieFormSchema>
