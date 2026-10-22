# QueryLab — simulador SQL no navegador

Base extensível para um laboratório de bancos relacionais. O projeto executa SQLite localmente no navegador e organiza a interface por funcionalidades para facilitar a adição de editor avançado, importação de schemas, múltiplos projetos e exercícios.

## Stack

- Next.js App Router e React com TypeScript
- React Flow (`@xyflow/react`) para o diagrama visual
- Zustand para estado compartilhado do workspace
- SQL.js para executar SQLite no navegador
- IndexedDB, via `idb`, para salvar workspaces localmente
- Faker.js para geração inicial de dados de exemplo

## Começar

Requer Node.js compatível com a versão instalada do Next.js.

```bash
npm install
npm run dev
```

Abra http://localhost:3000. O primeiro workspace inclui um schema de e-commerce de demonstração. Execute consultas pelo botão **Executar** ou com `Ctrl/Cmd + Enter`. **Salvar** guarda SQL e diagrama no IndexedDB deste navegador; **Exportar .sqlite** baixa o banco SQLite atual.

## Organização

```text
src/
  app/                  # rotas e layout do Next.js
  features/workspace/   # composição da tela, canvas e schema de exemplo
  lib/db/               # inicialização e operações SQL.js
  lib/data/             # geração de dados com Faker
  lib/storage/          # persistência de workspaces via IndexedDB
  store/                # estado compartilhado Zustand
  types/                # tipos do domínio
scripts/                # preparação do WASM do SQL.js
```

O arquivo WebAssembly do SQL.js é copiado para `public/` durante `postinstall`, `dev` e `build`. Assim, o runtime não depende de carregar o WASM de um CDN.

## Próximas extensões

- Separar armazenamento do banco SQL e snapshots de workspace no IndexedDB.
- Inspecionar `sqlite_master` para sincronizar diagramas com DDL executado no editor.
- Modelar chaves estrangeiras como relações editáveis no canvas.
- Adicionar importação de `.sql`/`.sqlite`, abas de consulta e histórico.
- Mover execução para Web Worker para consultas pesadas.

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm start` — servidor de produção
- `npm run lint` — lint
