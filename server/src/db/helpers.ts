import type { Database } from "sql.js";

/**
 * Executa uma query SQL e retorna as linhas como array de objetos.
 * Usado por todas as rotas que leem do SQLite (incidents, users, alerts, etc.).
 */
export function queryToObjects(
  db: Database,
  sql: string,
  params?: unknown[],
): Record<string, unknown>[] {
  const results =
    params !== undefined && params.length > 0
      ? db.exec(sql, params as number[] | string[])
      : db.exec(sql);
  if (results.length === 0) return [];
  return results[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    results[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}
