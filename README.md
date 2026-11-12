# QueryLab — simulador SQL no navegador

Simulador web de bancos relacionais ainda em desenvolvimento. 

## Stack

- Next.js App Router e React com TypeScript
- React Flow (`@xyflow/react`) para o diagrama visual
- PGLite para o banco de dados relacional
- Zustand para estado compartilhado do workspace
- IndexedDB, via `idb`, para salvar workspaces localmente
- Faker.js para geração inicial de dados de exemplo

## Começar

Requer Node.js compatível com a versão instalada do Next.js (16.4.2).

```bash
npm install
npm run dev
```
