# QueryLab — simulador SQL no navegador

Base para um laboratório de bancos relacionais. O projeto executa PostgreSQL localmente no navegador e organiza a interface por funcionalidades para facilitar a adição de editor avançado, importação de schemas, múltiplos projetos e exercícios.

## Stack

- Next.js App Router e React com TypeScript
- React Flow (`@xyflow/react`) para o diagrama visual
- PGLite para o banco de dados relacional
- Zustand para estado compartilhado do workspace
- IndexedDB, via `idb`, para salvar workspaces localmente
- Faker.js para geração inicial de dados de exemplo

## Começar

Requer Node.js compatível com a versão instalada do Next.js.

```bash
npm install
npm run dev
```

## Organização

Em Mudança...

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm start` — servidor de produção
- `npm run lint` — lint
