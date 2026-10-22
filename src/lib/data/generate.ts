import { faker } from "@faker-js/faker";
import { executeBatch } from "@/lib/db/engine";
import type { TableDefinition } from "@/types/database";

const generators: Record<string, () => string | number> = {
  id: () => faker.string.uuid(),
  name: () => faker.person.fullName(),
  email: () => faker.internet.email(),
  title: () => faker.lorem.words(3),
  price: () => Number(faker.commerce.price()),
  date: () => faker.date.recent().toISOString(),
  boolean: () => (faker.datatype.boolean() ? 1 : 0),
};

function valueFor(columnName: string, type: string): string | number {
  const name = columnName.toLowerCase();

  // Checa por um nome especifico primeiro, depois pelo tipo de coluna, se não encontrar nenhum, retorna um texto aleatório.
  const generator = Object.entries(generators).find(([key]) =>
    name.includes(key),
  )?.[1];
  if (generator) return generator();
  if (/int|real|numeric|decimal|float|double/i.test(type))
    return faker.number.int({ min: 1, max: 1000 });
  return faker.lorem.word();
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function quoteValue(value: string | number) {
  return typeof value === "number"
    ? String(value)
    : `'${value.replaceAll("'", "''")}'`;
}

export async function generateRows(table: TableDefinition, count: number) {
  const safeCount = Math.max(1, Math.min(500, Math.floor(count)));
  const columns = table.columns.filter(
    (column) => !column.primaryKey || !/int/i.test(column.type),
  );
  if (!columns.length) return;
  const statements = Array.from({ length: safeCount }, () => {
    const values = columns.map((column) =>
      quoteValue(valueFor(column.name, column.type)),
    );
    return `INSERT INTO ${quoteIdentifier(table.name)} (${columns.map((column) => quoteIdentifier(column.name)).join(", ")}) VALUES (${values.join(", ")});`;
  });
  await executeBatch(statements.join("\n"));
}
