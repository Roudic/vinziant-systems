const { createClient } = require('@libsql/client');

let client = null;

function getDb() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      throw new Error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in Vercel environment variables');
    }

    client = createClient({ url, authToken });
  }

  return client;
}

async function initSchema() {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS productivity_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

module.exports = { getDb, initSchema };