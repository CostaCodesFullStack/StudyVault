# StudyVault

Biblioteca pessoal de PDFs (faculdade, desenvolvimento, Cursor) com leitor, progresso, favoritos e anotações.

**Estado:** em validação. Verifique `npm run typecheck`, `lint`, `test` e `build` localmente antes de usar.

## Tecnologias
Next.js 15 (App Router), React 19, TypeScript, Tailwind 3, PostgreSQL + Prisma, Zod, jose + bcryptjs, pdf-lib, Vitest.

## Primeiros passos (desenvolvimento)
```bash
npm install
cp .env.example .env             # preencha POSTGRES_PASSWORD, DATABASE_URL (mesma senha) e AUTH_SECRET
docker compose up -d db          # PostgreSQL de desenvolvimento (somente em 127.0.0.1)
npx prisma validate
npx prisma migrate dev --name init   # GERA prisma/migrations (não existem no repositório) e aplica
npm run dev                      # http://localhost:3000
```
Depois de gerada, **versione a pasta `prisma/migrations`**. Em ambientes seguintes use `npm run db:deploy`.

## Scripts
`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `db:validate`, `db:generate`, `db:migrate`, `db:migrate:init`, `db:deploy`, `db:seed` (exige `SEED_PASSWORD`), `storage:cleanup`.

## Docker (app + banco)
```bash
docker compose --profile app up -d --build
```
O container da app executa `prisma migrate deploy` ao iniciar; **sem migrations versionadas ele não cria tabelas** (gere-as antes). Volumes: `pgdata` (banco), `storage` (PDFs).

## Storage e exclusão
`StorageService` (`src/lib/storage`) com implementação local; o banco guarda só metadados e `storageKey`. PDFs são servidos por `/api/files/[documentId]` após checar o dono.
Exclusão de documento: numa transação apaga o registro e grava `PendingFileDeletion`; depois remove o arquivo. Se o storage falhar, a pendência permanece — rode `npm run storage:cleanup` (pode ser agendado) para reprocessar.

## Estrutura acadêmica
Criar, editar e excluir semestre/disciplina/unidade/aula. Renomear muda o slug (URL); renumerar uma unidade recalcula o código das aulas. Excluir é bloqueado se houver PDFs na estrutura.

## Segurança
Cookie `httpOnly` assinado (`AUTH_SECRET` ≥ 32 caracteres obrigatório); bcrypt; toda consulta/alteração é escopada por `userId` no servidor, inclusive em toda a cadeia semestre→aula; upload valida extensão, MIME, tamanho (50 MB) e `%PDF-`; rate limit de login (5 tentativas/15 min, em memória, uma instância).

## Limitações conhecidas
- Reader usa o visualizador nativo: o progresso segue os botões de página, não a rolagem interna.
- Só storage local. Rate limit zera ao reiniciar o servidor.
- Testes cobrem lógica com mocks de banco; não há testes de integração com PostgreSQL.

## Troubleshooting
- "AUTH_SECRET ausente": defina no `.env` (≥ 32 caracteres).
- Tabelas inexistentes: gere/aplique as migrations (passo acima).
- Prisma Client desatualizado: `npm run db:generate`.

## Roadmap futuro
IA (resumos, chat com PDFs), tags/coleções, metas de estudo, storage em nuvem, PDF.js.
