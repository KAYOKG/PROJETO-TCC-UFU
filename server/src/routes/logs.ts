import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db/connection.js';

const router = Router();

interface LogBody {
  id: string;
  timestamp: string;
  userName: string;
  userId: string;
  accessLevel: string;
  action: string;
  details: string;
  origin: {
    module?: string;
    device?: string;
    browser?: string;
    ipAddress?: string;
    geolocation?: {
      latitude: number;
      longitude: number;
      city?: string;
      state?: string;
      country?: string;
    };
    network?: {
      type: string;
      speed: string;
      latency: number;
    };
  };
  session: {
    startTime: string;
    loginAttempts: number;
    lastActivity: string;
    inactivityTime?: number;
  };
  result: string;
  interactionType?: string;
  elementInfo?: {
    id?: string;
    className?: string;
    text?: string;
    type?: string;
  };
}

function logToParams(log: LogBody): unknown[] {
  return [
    log.id, log.timestamp, log.userName, log.userId, log.accessLevel, log.action, log.details,
    log.origin?.module ?? null, log.origin?.device ?? null, log.origin?.browser ?? null, log.origin?.ipAddress ?? null,
    log.origin?.geolocation?.latitude ?? null, log.origin?.geolocation?.longitude ?? null,
    log.origin?.geolocation?.city ?? null, log.origin?.geolocation?.state ?? null, log.origin?.geolocation?.country ?? null,
    log.origin?.network?.type ?? null, log.origin?.network?.speed ?? null, log.origin?.network?.latency ?? 0,
    log.session?.startTime ?? null, log.session?.loginAttempts ?? 0,
    log.session?.lastActivity ?? null, log.session?.inactivityTime ?? 0,
    log.result, log.interactionType ?? null,
    log.elementInfo?.id ?? null, log.elementInfo?.className ?? null,
    log.elementInfo?.text ?? null, log.elementInfo?.type ?? null,
  ];
}

const INSERT_SQL = `
  INSERT OR IGNORE INTO system_logs (
    id, timestamp, user_name, user_id, access_level, action, details,
    module, device, browser, ip_address,
    geo_latitude, geo_longitude, geo_city, geo_state, geo_country,
    network_type, network_speed, network_latency,
    session_start_time, session_login_attempts, session_last_activity, session_inactivity_time,
    result, interaction_type,
    element_id, element_class, element_text, element_type
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

router.post('/', async (req: Request, res: Response) => {
  try {
    const log: LogBody = req.body;
    const db = await getDb();
    db.run(INSERT_SQL, logToParams(log));
    saveDb();
    res.status(201).json({ success: true, id: log.id });
  } catch (error) {
    console.error('Error saving log:', error);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const logs: LogBody[] = req.body;
    const db = await getDb();
    for (const log of logs) {
      db.run(INSERT_SQL, logToParams(log));
    }
    saveDb();
    res.status(201).json({ success: true, count: logs.length });
  } catch (error) {
    console.error('Error saving logs batch:', error);
    res.status(500).json({ error: 'Failed to save logs batch' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { userId, limit = '100', offset = '0', startDate, endDate } = req.query;

    let query = 'SELECT * FROM system_logs WHERE 1=1';
    const params: unknown[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId as string);
    }
    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate as string);
    }
    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate as string);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const results = db.exec(query, params);
    const logs = results.length > 0
      ? results[0].values.map(row => {
          const obj: Record<string, unknown> = {};
          results[0].columns.forEach((col, i) => { obj[col] = row[i]; });
          return obj;
        })
      : [];

    const countQuery = 'SELECT COUNT(*) as total FROM system_logs WHERE 1=1'
      + (userId ? ' AND user_id = ?' : '')
      + (startDate ? ' AND timestamp >= ?' : '')
      + (endDate ? ' AND timestamp <= ?' : '');
    const countParams = params.slice(0, -2);
    const countResult = db.exec(countQuery, countParams);
    const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

    res.json({ logs, total, limit: Number(limit), offset: Number(offset) });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();

    const execSingle = (sql: string) => {
      const r = db.exec(sql);
      return r.length > 0 ? r[0] : null;
    };

    const totalResult = execSingle('SELECT COUNT(*) FROM system_logs');
    const totalLogs = totalResult ? (totalResult.values[0][0] as number) : 0;

    const usersResult = execSingle('SELECT COUNT(DISTINCT user_id) FROM system_logs');
    const uniqueUsers = usersResult ? (usersResult.values[0][0] as number) : 0;

    const actionResult = execSingle('SELECT action, COUNT(*) as count FROM system_logs GROUP BY action ORDER BY count DESC LIMIT 20');
    const actionBreakdown = actionResult
      ? actionResult.values.map(r => ({ action: r[0], count: r[1] }))
      : [];

    const moduleResult = execSingle('SELECT module, COUNT(*) as count FROM system_logs GROUP BY module ORDER BY count DESC');
    const moduleBreakdown = moduleResult
      ? moduleResult.values.map(r => ({ module: r[0], count: r[1] }))
      : [];

    const errorResult = execSingle(
      `SELECT ROUND(CAST(SUM(CASE WHEN result = 'error' THEN 1 ELSE 0 END) AS REAL) / MAX(COUNT(*), 1) * 100, 2) FROM system_logs`
    );
    const errorRate = errorResult ? (errorResult.values[0][0] as number) ?? 0 : 0;

    res.json({ totalLogs, uniqueUsers, actionBreakdown, moduleBreakdown, errorRate });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
