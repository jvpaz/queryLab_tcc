import type { TableDefinition } from "@/types/database";

//Banco de dados de exemplo para o ambiente de desenvolvimento, só é utilizado quando seedDatabase em QueryLab.tsx é true.

export const sampleTables: TableDefinition[] = [
  {
    id: "customers",
    name: "customers",
    position: { x: 90, y: 115 },
    rowCount: 128,
    columns: [
      { name: "id", type: "INTEGER", primaryKey: true },
      { name: "name", type: "TEXT" },
      { name: "email", type: "TEXT" },
      { name: "created_at", type: "TEXT" },
    ],
  },
  {
    id: "orders",
    name: "orders",
    position: { x: 420, y: 210 },
    rowCount: 346,
    columns: [
      { name: "id", type: "INTEGER", primaryKey: true },
      { name: "customer_id", type: "INTEGER" },
      { name: "total", type: "REAL" },
      { name: "status", type: "TEXT" },
    ],
  },
  {
    id: "products",
    name: "products",
    position: { x: 420, y: 475 },
    rowCount: 64,
    columns: [
      { name: "id", type: "INTEGER", primaryKey: true },
      { name: "name", type: "TEXT" },
      { name: "price", type: "REAL" },
    ],
  },
  {
    id: "order_items",
    name: "order_items",
    position: { x: 745, y: 350 },
    rowCount: 892,
    columns: [
      { name: "id", type: "INTEGER", primaryKey: true },
      { name: "order_id", type: "INTEGER" },
      { name: "product_id", type: "INTEGER" },
      { name: "quantity", type: "INTEGER" },
    ],
  },
];

export const seedSql = `
CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, customer_id INTEGER, total REAL, status TEXT, FOREIGN KEY(customer_id) REFERENCES customers(id));
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, price REAL);
CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER, quantity INTEGER, FOREIGN KEY(order_id) REFERENCES orders(id), FOREIGN KEY(product_id) REFERENCES products(id));
INSERT OR IGNORE INTO customers VALUES (1, 'Ana Souza', 'ana@example.com', '2025-01-12'), (2, 'Bruno Lima', 'bruno@example.com', '2025-01-14'), (3, 'Carla Dias', 'carla@example.com', '2025-01-18');
INSERT OR IGNORE INTO orders VALUES (1, 1, 249.90, 'completed'), (2, 2, 89.50, 'processing'), (3, 1, 520.00, 'completed'), (4, 3, 45.00, 'cancelled');
INSERT OR IGNORE INTO products VALUES (1, 'Teclado mecânico', 249.90), (2, 'Mouse sem fio', 89.50), (3, 'Monitor 27 pol.', 520.00);
INSERT OR IGNORE INTO order_items VALUES (1, 1, 1, 1), (2, 2, 2, 1), (3, 3, 3, 1), (4, 4, 2, 1);
`;
