import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function queryToObjects(db: Awaited<ReturnType<typeof getDb>>, sql: string, params: unknown[] = []) {
  const results = db.exec(sql, params);
  if (results.length === 0) return [];
  return results[0].values.map(row => {
    const obj: Record<string, unknown> = {};
    results[0].columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { userId, limit = '50', offset = '0', minScore } = req.query;

    let query = 'SELECT * FROM risk_alerts WHERE 1=1';
    const params: unknown[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId as string);
    }
    if (minScore) {
      query += ' AND risk_score >= ?';
      params.push(Number(minScore));
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const alerts = queryToObjects(db, query, params);
    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();

    const userRisks = queryToObjects(db, `
      SELECT user_id, user_name, COUNT(*) as alert_count,
        ROUND(AVG(risk_score), 3) as avg_risk,
        ROUND(MAX(risk_score), 3) as max_risk,
        MAX(created_at) as last_alert
      FROM risk_alerts GROUP BY user_id ORDER BY avg_risk DESC
    `);

    const alertsByType = queryToObjects(db, `
      SELECT alert_type, COUNT(*) as count, ROUND(AVG(risk_score), 3) as avg_score
      FROM risk_alerts GROUP BY alert_type ORDER BY count DESC
    `);

    const recentAlerts = queryToObjects(db, 'SELECT * FROM risk_alerts ORDER BY created_at DESC LIMIT 20');

    const mlVsRules = queryToObjects(db, `
      SELECT CASE WHEN is_ml_detection = 1 THEN 'ML' ELSE 'Rules' END as method,
        COUNT(*) as detections, ROUND(AVG(risk_score), 3) as avg_score
      FROM risk_alerts GROUP BY is_ml_detection
    `);

    res.json({ userRisks, alertsByType, recentAlerts, mlVsRules });
  } catch (error) {
    console.error('Error fetching alert summary:', error);
    res.status(500).json({ error: 'Failed to fetch alert summary' });
  }
});

export default router;
