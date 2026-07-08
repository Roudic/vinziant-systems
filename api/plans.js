const { getDb, initSchema } = require('../lib/db');

module.exports = async function handler(req, res) {
  try {
    await initSchema();
    const db = getDb();

    if (req.method === 'GET') {
      const { id } = req.query;

      if (id) {
        const result = await db.execute({
          sql: 'SELECT id, name, data, created_at, updated_at FROM productivity_plans WHERE id = ?',
          args: [id],
        });

        if (!result.rows.length) {
          return res.status(404).json({ error: 'Plan not found' });
        }

        const row = result.rows[0];
        return res.status(200).json({
          id: row.id,
          name: row.name,
          data: JSON.parse(row.data),
          created_at: row.created_at,
          updated_at: row.updated_at,
        });
      }

      const result = await db.execute(
        'SELECT id, name, updated_at FROM productivity_plans ORDER BY updated_at DESC'
      );

      return res.status(200).json({
        plans: result.rows.map((row) => ({
          id: row.id,
          name: row.name,
          updated_at: row.updated_at,
        })),
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, name, data } = body;

      if (!name || !data) {
        return res.status(400).json({ error: 'name and data are required' });
      }

      const planId = id || crypto.randomUUID();
      const payload = JSON.stringify(data);

      await db.execute({
        sql: `INSERT INTO productivity_plans (id, name, data, updated_at)
              VALUES (?, ?, ?, datetime('now'))
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                data = excluded.data,
                updated_at = datetime('now')`,
        args: [planId, name, payload],
      });

      const saved = await db.execute({
        sql: 'SELECT id, name, updated_at FROM productivity_plans WHERE id = ?',
        args: [planId],
      });

      return res.status(200).json({
        ok: true,
        plan: saved.rows[0],
      });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      await db.execute({
        sql: 'DELETE FROM productivity_plans WHERE id = ?',
        args: [id],
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Turso API error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
};