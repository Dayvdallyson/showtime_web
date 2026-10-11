import { screen, waitFor, within } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { http, HttpResponse } from "msw/http"
import { describe, expect, test } from "vitest"

import { MoviesPage } from "@/features/movies/components/movies-page"
import type { Movie } from "@/features/movies/schemas"
import {
  apiError,
  buildMovie,
  createMovieDb,
  MOVIES_URL,
} from "@/test/movie-db"
import { renderWithProviders } from "@/test/render"
import { server } from "@/test/server"

/** Renderiza a página com a API fake e espera a lista carregar. */
async function renderPage(initial: Movie[] = []) {
  const db = createMovieDb(initial)
  server.use(...db.handlers)

  const user = userEvent.setup()
  renderWithProviders(<MoviesPage />)
  await screen.findByRole("heading", { name: /gerenciar filmes|editando/i })

  return { db, user }
}

function movieForm() {
  return screen.getByRole("form", { name: /cadastrar filme|editar/i })
}

describe("cadastro de filme", () => {
  test("valida os campos sem chamar a API", async () => {
    let posts = 0
    const { user } = await renderPage()
    server.use(
      http.post(MOVIES_URL, () => {
        posts += 1
        return HttpResponse.json({}, { status: 500 })
      })
    )

    await user.click(screen.getByRole("button", { name: "Adicionar" }))

    expect(await screen.findByText("Informe o título")).toBeInTheDocument()
    expect(screen.getByText("Informe o gênero")).toBeInTheDocument()
    expect(screen.getByText("Informe o ano com 4 dígitos")).toBeInTheDocument()
    expect(screen.getByLabelText("Título")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    expect(posts).toBe(0)
  })

  test("envia, mostra o filme, avisa e limpa o formulário", async () => {
    const { db, user } = await renderPage()

    await user.type(screen.getByLabelText("Título"), "  Duna ")
    await user.type(screen.getByLabelText("Gênero"), "Ficção")
    await user.type(screen.getByLabelText("Ano"), "2021")
    await user.click(screen.getByRole("button", { name: "Adicionar" }))

    expect(await screen.findByText("“Duna” adicionado")).toBeInTheDocument()
    const list = await screen.findByRole("list", { name: "Filmes cadastrados" })
    expect(within(list).getByText("Duna")).toBeInTheDocument()
    expect([...db.movies.values()][0]).toMatchObject({
      title: "Duna",
      genre: "Ficção",
      year: 2021,
      accent: "#6366f1",
    })
    expect(screen.getByLabelText("Título")).toHaveValue("")
  })

  test("mostra no campo o erro de validação devolvido pela API", async () => {
    const { user } = await renderPage()
    server.use(
      http.post(MOVIES_URL, () =>
        apiError(400, "VALIDATION_ERROR", "Dados inválidos", {
          title: ["Título já cadastrado"],
        })
      )
    )

    await user.type(screen.getByLabelText("Título"), "Duna")
    await user.type(screen.getByLabelText("Gênero"), "Ficção")
    await user.type(screen.getByLabelText("Ano"), "2021")
    await user.click(screen.getByRole("button", { name: "Adicionar" }))

    expect(await screen.findByText("Título já cadastrado")).toBeInTheDocument()
    expect(screen.getByLabelText("Título")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    expect(
      screen.getByText("Não foi possível adicionar o filme")
    ).toBeInTheDocument()
    // Os valores ficam para o usuário corrigir
    expect(screen.getByLabelText("Título")).toHaveValue("Duna")
  })
})

describe("edição de filme", () => {
  test("preenche o formulário e envia só o que mudou", async () => {
    const movie = buildMovie({ title: "Duna", genre: "Ficção", year: 2021 })
    let patchBody: unknown
    const { user } = await renderPage([movie])
    server.use(
      http.patch(`${MOVIES_URL}/:id`, async ({ request }) => {
        patchBody = await request.json()
        return HttpResponse.json({ ...movie, title: "Duna: Parte 1" })
      })
    )

    await user.click(screen.getByRole("button", { name: "Editar Duna" }))

    const form = movieForm()
    expect(within(form).getByLabelText("Título")).toHaveValue("Duna")
    expect(within(form).getByLabelText("Ano")).toHaveValue(2021)
    expect(
      within(form).getByRole("button", { name: "Salvar alterações" })
    ).toBeDisabled()

    await user.type(within(form).getByLabelText("Título"), ": Parte 1")
    await user.click(
      within(form).getByRole("button", { name: "Salvar alterações" })
    )

    expect(
      await screen.findByText("“Duna: Parte 1” atualizado")
    ).toBeInTheDocument()
    expect(patchBody).toEqual({ title: "Duna: Parte 1" })
    expect(
      screen.getByRole("heading", { name: "Gerenciar filmes" })
    ).toBeInTheDocument()
  })

  test("cancelar volta ao cadastro sem enviar nada", async () => {
    const { user } = await renderPage([buildMovie({ title: "Duna" })])

    await user.click(screen.getByRole("button", { name: "Editar Duna" }))
    await user.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(
      screen.getByRole("heading", { name: "Gerenciar filmes" })
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Título")).toHaveValue("")
  })
})

describe("exclusão de filme", () => {
  test("tira o filme da lista e avisa", async () => {
    const { user } = await renderPage([
      buildMovie({ title: "Duna" }),
      buildMovie({ title: "Alien" }),
    ])

    await user.click(screen.getByRole("button", { name: "Excluir Duna" }))

    const list = screen.getByRole("list", { name: "Filmes cadastrados" })
    await waitFor(() =>
      expect(within(list).queryByText("Duna")).not.toBeInTheDocument()
    )
    expect(await screen.findByText("“Duna” excluído")).toBeInTheDocument()
    expect(within(list).getByText("Alien")).toBeInTheDocument()
  })

  test("devolve o filme e mostra o erro quando a API falha", async () => {
    const { user } = await renderPage([buildMovie({ title: "Duna" })])
    server.use(
      http.delete(`${MOVIES_URL}/:id`, () =>
        apiError(500, "INTERNAL_ERROR", "Erro interno")
      )
    )

    await user.click(screen.getByRole("button", { name: "Excluir Duna" }))

    expect(
      await screen.findByText("Não foi possível excluir “Duna”")
    ).toBeInTheDocument()
    const list = screen.getByRole("list", { name: "Filmes cadastrados" })
    expect(within(list).getByText("Duna")).toBeInTheDocument()
  })
})

describe("estados da página", () => {
  test("mostra estado vazio", async () => {
    await renderPage()

    expect(screen.getByText("Nenhum filme cadastrado.")).toBeInTheDocument()
    expect(screen.getByText(/nenhum filme em destaque/i)).toBeInTheDocument()
  })

  test("mostra erro com opção de tentar de novo", async () => {
    server.use(
      http.get(MOVIES_URL, () =>
        apiError(500, "INTERNAL_ERROR", "Erro interno")
      )
    )
    renderWithProviders(<MoviesPage />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(
      "Não foi possível carregar os filmes: Erro interno"
    )

    server.use(...createMovieDb([buildMovie({ title: "Duna" })]).handlers)
    await userEvent
      .setup()
      .click(within(alert).getByRole("button", { name: "Tentar novamente" }))

    expect(
      await screen.findByRole("heading", { name: "Gerenciar filmes" })
    ).toBeInTheDocument()
  })
})

describe("catálogo maior que uma página", () => {
  test("avisa quantos filmes ficaram de fora", async () => {
    const movies = Array.from({ length: 101 }, () => buildMovie())
    await renderPage(movies)

    expect(screen.getByText("Mostrando 100 de 101 filmes.")).toBeInTheDocument()
  })
})
