# Showtime Web

Front do Showtime: um carrossel 3D de filmes e um painel para cadastrar, editar e excluir filmes. Os dados vêm da API em `../api`.

## Stack

- Vite 8 + React 19 + TypeScript 6
- Tailwind CSS 4 via `@tailwindcss/vite`
- shadcn/ui (componentes em `src/components/ui`)
- TanStack Query v5 + Devtools
- React Hook Form + Zod (formulários e validação do contrato da API)
- lucide-react
- Vitest + Testing Library + MSW (testes)
- oxlint + Prettier (com ordenação de classes do Tailwind)

## Pré-requisitos

- Node.js 24 ou mais recente
- pnpm 11 (o front e a API usam pnpm)
- Docker, para o Postgres da API

## Como rodar

Use dois terminais: um para a API e outro para o front.

### 1. API (terminal 1)

```bash
cd ~/Documentos/showtime/api
[ -f .env ] || cp .env.example .env
pnpm install
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- `db:up` sobe o Postgres no Docker e espera ele ficar saudável.
- `db:migrate` aplica as migrations.
- `db:seed` popula os filmes iniciais. Só é preciso na primeira vez.

Para conferir se a API está no ar:

```bash
curl http://localhost:3333/health
```

A resposta deve ser `{"status":"ok","database":"up"}`.

A documentação da API (OpenAPI) fica em http://localhost:3333/docs.

### 2. Front (terminal 2)

```bash
cd ~/Documentos/showtime/web
pnpm install
pnpm dev
```

Depois, abra http://localhost:5173.

### Do segundo uso em diante

Basta subir o banco, a API e o front:

```bash
cd ~/Documentos/showtime/api && pnpm db:up && pnpm dev
```

```bash
cd ~/Documentos/showtime/web && pnpm dev
```

## Variáveis de ambiente

O arquivo `.env` é opcional. Sem ele, o front usa `http://localhost:3333`.

```env
VITE_API_URL=http://localhost:3333
```

As variáveis são validadas com Zod em `src/config/env.ts` quando o app abre. Uma URL inválida derruba a inicialização com uma mensagem clara, em vez de falhar na primeira requisição. Valor vazio conta como ausente.

A API só aceita requisições das origens em `WEB_ORIGIN`, no `.env` da API. A lista é separada por vírgula, e o `.env.example` já traz `http://localhost:5173` e `https://dayvdallyson.github.io`. Se o front rodar em outra porta ou domínio, acrescente a origem nessa lista.

## Scripts

| Comando             | O que faz                                           |
| ------------------- | --------------------------------------------------- |
| `pnpm dev`          | Servidor de desenvolvimento em `localhost:5173`     |
| `pnpm build`        | Checa os tipos (`tsc -b`) e gera o build em `dist/` |
| `pnpm preview`      | Serve o build de `dist/` localmente                 |
| `pnpm typecheck`    | Só checa os tipos                                   |
| `pnpm lint`         | Roda o oxlint                                       |
| `pnpm format`       | Formata tudo com Prettier                           |
| `pnpm format:check` | Confere a formatação sem alterar (usado no CI)      |
| `pnpm test`         | Roda os testes uma vez                              |
| `pnpm test:watch`   | Roda os testes em modo watch                        |

## CI/CD

O workflow em `.github/workflows/ci.yml` roda no GitHub Actions:

- **CI** (todo push na `main` e todo pull request): `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm format:check`, `pnpm test` e `pnpm build`.
- **CD** (só push na `main`): publica o `dist/` no GitHub Pages, em `https://<usuário>.github.io/showtime_web/`.

Para o deploy funcionar:

1. Em **Settings → Pages**, escolha **GitHub Actions** como source.
2. Em **Settings → Secrets and variables → Actions → Variables**, crie `VITE_API_URL` com a URL pública da API. Sem ela, o build usa `http://localhost:3333`.
3. Adicione a origem do Pages ao `WEB_ORIGIN` da API.

## Estrutura

O código é organizado por feature: tudo o que é de filmes fica em `features/movies`. Fora dela ficam só o que é global (`app`, `config`, `lib`) e os componentes sem regra de negócio (`components`).

```
src/
├── main.tsx                       monta <Providers><App/></Providers>
├── app/
│   ├── app.tsx                    raiz da interface
│   ├── providers.tsx              QueryClientProvider, Toaster, Devtools
│   └── query-client.ts            QueryClient e a regra de retry
├── config/env.ts                  variáveis VITE_* validadas com Zod
├── lib/
│   ├── http-client.ts             request() e ApiError (status, code, details)
│   └── utils.ts                   cn()
├── components/
│   ├── ui/                        só componentes do shadcn
│   └── carousel-3d/               carrossel 3D + funções puras (carousel-math.ts)
├── features/movies/
│   ├── schemas.ts                 schemas Zod da API e do formulário, tipos via z.infer
│   ├── api/
│   │   ├── movie-keys.ts          query key factory
│   │   ├── movie-service.ts       chamadas HTTP (list, create, update, remove)
│   │   ├── movie-queries.ts       queryOptions das leituras, com staleTime próprio
│   │   └── use-*-movie.ts         mutations (create, update, delete otimista)
│   └── components/
│       ├── movies-page.tsx        busca a lista; carregando, erro e vazio
│       ├── movie-carousel.tsx     Movie → item do Carousel3D
│       ├── movie-manager.tsx      liga os hooks ao formulário e à lista; toasts
│       ├── movie-form.tsx         criar e editar (React Hook Form + Zod)
│       └── movie-list.tsx         lista com editar e excluir
└── test/                          setup do Vitest, API fake (MSW) e helpers de render
```

Os testes ficam ao lado do código que testam (`*.test.ts(x)`).

## Decisões

**Componentes não sabem de HTTP.** O fluxo de uma requisição é `componente → hook → movie-service → http-client`. Os componentes de apresentação (`movie-form`, `movie-list`, `movie-carousel`) recebem dados e callbacks por props. Só `movies-page` e `movie-manager` usam os hooks. O `http-client` não conhece nenhuma feature.

**Query key factory (`movie-keys.ts`).** Nenhuma key é escrita à mão fora desse arquivo. As keys são hierárquicas (`["movies", "list", filtros]`, `["movies", "detail", id]`), então a invalidação é precisa: criar um filme invalida só `lists()`, e editar invalida `lists()` e o `detail(id)` daquele filme.

**staleTime por query, não global.** Um valor global trata dados diferentes do mesmo jeito. Cada query declara o seu numa constante comentada em `movie-queries.ts`. A lista usa 5 minutos: os filmes só mudam por este app, e toda mutation já invalida a lista na hora.

**Retry só quando pode dar certo.** `query-client.ts` não repete erro 4xx nem resposta fora do contrato, porque a nova tentativa daria o mesmo resultado. Falha de rede e 5xx repetem até 3 vezes, o padrão do TanStack Query.

**Validação na fronteira.** Toda resposta da API passa por um schema Zod em `movie-service.ts` antes de entrar no cache. Se a API mudar o contrato, o erro aparece ali, com o campo exato, e não como `undefined` no meio de um componente. Os tipos saem dos schemas (`z.infer`), então não existe tipo copiado à mão.

**Erros tipados.** A API responde erros no envelope `{ error: { code, message, details? } }`. O `http-client` transforma toda resposta de erro em `ApiError` com `status`, `code` e `details`. O retry usa o `status`, e o formulário usa os `details` para mostrar o erro de validação da API no campo certo.

**Lista paginada.** A API devolve `{ data, meta: { page, pageSize, total } }`. A interface não tem paginação: carrossel e lista mostram o catálogo numa tela, então a página pede 100 itens (o máximo da API). Se houver mais, aparece "Mostrando 100 de N filmes".

**Exclusão otimista.** O filme some da lista e do carrossel na hora. Se a API falhar, ele volta e aparece um toast de erro. Ao final, a lista é buscada de novo para confirmar com o servidor.

**Edição envia só o que mudou.** O PATCH leva apenas os campos alterados (`dirtyFields` do React Hook Form).

**Testes no nível da rede.** O MSW intercepta o `fetch`, então os testes passam pelo mesmo caminho do app real: hook, service, http-client e validação. A API fake em `src/test/movie-db.ts` segue o contrato da API, e cada teste cria a sua.

## Componentes do shadcn

Instale sempre pelo CLI:

```bash
pnpm dlx shadcn@latest add <nome>
```

## Problemas comuns

- **"Não foi possível carregar os filmes"**: a API não está rodando. Confira com `curl http://localhost:3333/health`.
- **Erro de CORS no console**: o front não está em `http://localhost:5173`. Acrescente a origem dele em `WEB_ORIGIN` no `.env` da API.
- **"Muitas requisições, tente de novo em instantes"**: a API limita as requisições por IP (`RATE_LIMIT_MAX` a cada `RATE_LIMIT_WINDOW_MS`, no `.env` da API; o padrão é 100 a cada 15 minutos). Em desenvolvimento, aumente `RATE_LIMIT_MAX`.
- **Porta 5432 ocupada**: outro Postgres está rodando na máquina. Pare esse Postgres ou mude a porta no `docker-compose.yml` e no `DATABASE_URL` da API.
- **Não force correções do audit** (`pnpm audit --fix`, `npm audit fix --force` ou equivalente): o CLI do shadcn volta para a 1.0.
- **O `node_modules` aponta para `~/node_modules/.pnpm`**: o `pnpm-workspace.yaml` deste projeto sumiu. Ele existe para que o pnpm trate o `web` como a raiz e não use o `~/pnpm-workspace.yaml` da sua home.
