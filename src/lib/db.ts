type QueryResult<T> = {
  rows: T[];
};

type Queryable = {
  query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
};

type PgPool = Queryable & {
  connect(): Promise<Queryable & { release(): void }>;
};

type PgModule = {
  Pool: new (config: { connectionString: string; ssl?: { rejectUnauthorized: boolean } }) => PgPool;
};

const { Pool } = require("pg") as PgModule;

const globalForDb = globalThis as typeof globalThis & {
  communityMapPool?: PgPool;
};

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const isLocalDatabase = /localhost|127\.0\.0\.1/i.test(connectionString);

  return new Pool({
    connectionString,
    ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false }
  });
}

export function getPool() {
  if (!globalForDb.communityMapPool) {
    globalForDb.communityMapPool = createPool();
  }

  return globalForDb.communityMapPool;
}

export function query<T = unknown>(text: string, params?: unknown[]) {
  return getPool().query<T>(text, params);
}

export async function transaction<T>(callback: (client: Queryable) => Promise<T>) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
