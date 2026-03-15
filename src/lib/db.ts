import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Run a query against the database. Returns rows.
 * Silently returns empty array if DATABASE_URL is not set (fallback to in-memory).
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  if (!hasDatabase()) return [];
  try {
    const result = await getPool().query(sql, params);
    return result.rows as T[];
  } catch (err) {
    console.error("[DB] Query failed:", (err as Error).message);
    return [];
  }
}

/**
 * Run a query that returns a single row.
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Run a mutation (INSERT/UPDATE/DELETE). Returns affected row count.
 */
export async function execute(
  sql: string,
  params?: unknown[]
): Promise<number> {
  if (!hasDatabase()) return 0;
  try {
    const result = await getPool().query(sql, params);
    return result.rowCount ?? 0;
  } catch (err) {
    console.error("[DB] Execute failed:", (err as Error).message);
    return 0;
  }
}
