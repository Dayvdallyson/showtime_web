# Showtime Web

Front do Showtime: um carrossel 3D de filmes e um painel para cadastrar e excluir filmes. Os dados vêm da API em `../api`.

## Stack

- Vite 8 + React 19 + TypeScript 6
- Tailwind CSS 4 via `@tailwindcss/vite`
- shadcn/ui (componentes em `src/components/ui`)
- TanStack Query v5 + Devtools
- lucide-react

## Pré-requisitos

- Node.js 24 ou mais recente
- pnpm 11 (o front) e npm (a API)
- Docker, para o Postgres da API

## Como rodar

Use dois terminais: um para a API e outro para o front.

### 1. API (terminal 1)

```bash
cd ~/Documentos/showtime/api
[ -f .env ] || cp .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

- `db:up` sobe o Postgres no Docker e espera ele ficar saudável.
- `db:migrate` aplica as migrations.
- `db:seed` popula os filmes iniciais. Só é preciso na primeira vez.

Para conferir se a API está no ar:

```bash
curl http://localhost:3333/health
```

A resposta deve ser `{"ok":true}`.

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
cd ~/Documentos/showtime/api && npm run db:up && npm run dev
```

```bash
cd ~/Documentos/showtime/web && pnpm dev
```

## Variáveis de ambiente

O arquivo `.env` é opcional. Sem ele, o front usa `http://localhost:3333`.

```env
VITE_API_URL=http://localhost:3333
```

A API só aceita requisições da origem em `WEB_ORIGIN` (`http://localhost:5173` por padrão, no `.env` da API). Se o front rodar em outra porta, ajuste esse valor.

## Scripts

| Comando        | O que faz                                           |
| -------------- | --------------------------------------------------- |
| `pnpm dev`     | Servidor de desenvolvimento em `localhost:5173`     |
| `pnpm build`   | Checa os tipos (`tsc -b`) e gera o build em `dist/` |
| `pnpm preview` | Serve o build de `dist/` localmente                 |
| `pnpm lint`    | Roda o oxlint                                       |

## CI/CD

O workflow em `.github/workflows/ci.yml` roda no GitHub Actions:

- **CI** (todo push na `main` e todo pull request): `pnpm install --frozen-lockfile`, `pnpm lint` e `pnpm build`.
- **CD** (só push na `main`): publica o `dist/` no GitHub Pages, em `https://<usuário>.github.io/showtime_web/`.

Para o deploy funcionar:

1. Em **Settings → Pages**, escolha **GitHub Actions** como source.
2. Em **Settings → Secrets and variables → Actions → Variables**, crie `VITE_API_URL` com a URL pública da API. Sem ela, o build usa `http://localhost:3333`.
3. Adicione a origem do Pages ao `WEB_ORIGIN` da API.

## Estrutura

```
src/
├── main.tsx               QueryClient + QueryClientProvider + Devtools
├── App.tsx                busca os filmes e monta a página
├── index.css              Tailwind + tema do shadcn
├── lib/
│   ├── api.ts             tipos, request(), moviesQuery, createMovie, deleteMovie
│   └── utils.ts           cn()
└── components/
    ├── ui/                só componentes do shadcn
    ├── carousel-3d.tsx    carrossel 3D (setas, clique no card, pontinhos, ← →)
    └── movie-manager.tsx  formulário de cadastro + lista com excluir
```

## Componentes do shadcn

Instale sempre pelo CLI:

```bash
pnpm dlx shadcn@latest add <nome>
```

## Problemas comuns

- **"Não foi possível carregar os filmes"**: a API não está rodando. Confira com `curl http://localhost:3333/health`.
- **Erro de CORS no console**: o front não está em `http://localhost:5173`. Ajuste `WEB_ORIGIN` no `.env` da API.
- **Porta 5432 ocupada**: outro Postgres está rodando na máquina. Pare esse Postgres ou mude a porta no `docker-compose.yml` e no `DATABASE_URL` da API.
- **Não force correções do audit** (`npm audit fix --force` ou equivalente): o CLI do shadcn volta para a 1.0.
- **O `node_modules` aponta para `~/node_modules/.pnpm`**: o `pnpm-workspace.yaml` deste projeto sumiu. Ele existe para que o pnpm trate o `web` como a raiz e não use o `~/pnpm-workspace.yaml` da sua home.
