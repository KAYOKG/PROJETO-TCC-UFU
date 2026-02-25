import { Request, Response, Router } from "express";
import { getDb, saveDb } from "../db/connection.js";

const router = Router();
const COMMON_USER_IDS = ["user1", "user2"];
const LAST_N_PREDICTIONS = 20;

function queryToObjects(
  db: Awaited<ReturnType<typeof getDb>>,
  sql: string,
  params?: unknown[],
) {
  const results = params
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

/** Média ponderada: últimas N predições, mais peso às recentes (índice 0 = mais recente) */
function weightedAverage(scores: number[]): number {
  if (scores.length === 0) return 0;
  let sum = 0;
  let weightSum = 0;
  scores.forEach((s, i) => {
    const w = scores.length - i;
    sum += s * w;
    weightSum += w;
  });
  return weightSum > 0 ? sum / weightSum : 0;
}

router.post("/predictions", async (req: Request, res: Response) => {
  try {
    const { userId, riskScore, logId } = req.body as {
      userId?: string;
      riskScore?: number;
      logId?: string;
    };
    if (!userId || riskScore == null) {
      res.status(400).json({ error: "Missing userId or riskScore" });
      return;
    }
    if (String(userId).toLowerCase() === "superadmin") {
      res
        .status(400)
        .json({ error: "Predictions for SuperAdmin are not stored" });
      return;
    }
    if (String(userId).toLowerCase() === "system") {
      res.status(400).json({ error: "Predictions for system are not stored" });
      return;
    }

    const db = await getDb();
    db.run(
      `INSERT INTO risk_predictions (user_id, risk_score, log_id) VALUES (?, ?, ?)`,
      [userId, riskScore, logId ?? null],
    );
    saveDb();

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error storing prediction:", error);
    res.status(500).json({ error: "Failed to store prediction" });
  }
});

router.get("/risk-levels", async (_req: Request, res: Response) => {
  try {
    const db = await getDb();

    const userIdsFromData = queryToObjects(
      db,
      `SELECT DISTINCT user_id FROM risk_predictions
       UNION
       SELECT DISTINCT user_id FROM incidents
       WHERE LOWER(user_id) != 'superadmin'`,
    ) as { user_id: string }[];
    const allUserIds = new Set<string>(COMMON_USER_IDS);
    userIdsFromData.forEach((r) => allUserIds.add(r.user_id));

    const now = new Date().toISOString();
    const results: Array<{
      userId: string;
      userName: string;
      currentRiskScore: number;
      status: "active" | "suspended" | "observation";
      lastAction: { timestamp: string; description: string } | null;
      totalIncidents: number;
      activeBlock: {
        reason: string;
        blockedUntil: string | null;
        incidentId: number;
      } | null;
    }> = [];

    for (const userId of allUserIds) {
      if (String(userId).toLowerCase() === "superadmin") continue;
      if (String(userId).toLowerCase() === "system") continue;

      const predictions = queryToObjects(
        db,
        `SELECT risk_score FROM risk_predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT ${LAST_N_PREDICTIONS}`,
        [userId],
      ) as { risk_score: number }[];
      const scores = predictions.map((p) => Number(p.risk_score));
      const currentRiskScore = weightedAverage(scores);

      const blocks = queryToObjects(
        db,
        `SELECT * FROM user_blocks WHERE user_id = ? AND status = 'active' ORDER BY blocked_at DESC LIMIT 1`,
        [userId],
      ) as {
        reason: string;
        blocked_until: string | null;
        incident_id: number;
      }[];

      const block = blocks[0];
      const isSuspended = !!(
        block &&
        (!block.blocked_until || block.blocked_until > now)
      );

      let status: "active" | "suspended" | "observation" = "active";
      if (isSuspended) status = "suspended";
      else if (currentRiskScore >= 0.4 && currentRiskScore < 0.7)
        status = "observation";

      const incidentCount = queryToObjects(
        db,
        `SELECT COUNT(*) as c FROM incidents WHERE user_id = ?`,
        [userId],
      ) as { c: number }[];
      const totalIncidents = Number(incidentCount[0]?.c ?? 0);

      const lastLog = queryToObjects(
        db,
        `SELECT timestamp, action, details FROM system_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1`,
        [userId],
      ) as { timestamp: string; action: string; details: string }[];
      const lastActionRow = lastLog[0];
      const lastAction = lastActionRow
        ? {
            timestamp: lastActionRow.timestamp,
            description: lastActionRow.details || lastActionRow.action,
          }
        : null;

      const userNameRow = queryToObjects(
        db,
        `SELECT user_name FROM incidents WHERE user_id = ? LIMIT 1`,
        [userId],
      ) as { user_name: string }[];
      const userName = userNameRow[0]?.user_name ?? userId;

      let incidentDetail: Record<string, unknown> | null = null;
      if (isSuspended && block?.incident_id) {
        const incRows = queryToObjects(
          db,
          `SELECT * FROM incidents WHERE id = ?`,
          [block.incident_id],
        );
        if (incRows[0]) incidentDetail = incRows[0] as Record<string, unknown>;
      }

      results.push({
        userId,
        userName,
        currentRiskScore,
        status,
        lastAction,
        totalIncidents,
        activeBlock:
          isSuspended && block
            ? {
                reason: block.reason ?? "",
                blockedUntil: block.blocked_until,
                incidentId: block.incident_id,
                incident: incidentDetail,
              }
            : null,
      });
    }

    res.json({ users: results });
  } catch (error) {
    console.error("Error fetching risk levels:", error);
    res.status(500).json({ error: "Failed to fetch risk levels" });
  }
});

router.post("/:userId/force-logout", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (String(userId).toLowerCase() === "superadmin") {
      res.status(400).json({ error: "Cannot force-logout SuperAdmin" });
      return;
    }

    const db = await getDb();
    const now = new Date().toISOString();
    db.run(
      `INSERT OR REPLACE INTO session_invalidations (user_id, invalidated_at) VALUES (?, ?)`,
      [userId, now],
    );
    saveDb();
    res.json({ success: true });
  } catch (error) {
    console.error("Error force-logout:", error);
    res.status(500).json({ error: "Failed to force logout" });
  }
});

router.get("/:userId/session-status", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const db = await getDb();
    const rows = queryToObjects(
      db,
      `SELECT invalidated_at FROM session_invalidations WHERE user_id = ?`,
      [userId],
    ) as { invalidated_at: string }[];
    const invalidated = rows.length > 0;
    res.json({ valid: !invalidated });
  } catch (error) {
    console.error("Error session status:", error);
    res.status(500).json({ error: "Failed to check session" });
  }
});

router.post(
  "/:userId/clear-session-invalidation",
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const db = await getDb();
      db.run(`DELETE FROM session_invalidations WHERE user_id = ?`, [userId]);
      saveDb();
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing session invalidation:", error);
      res.status(500).json({ error: "Failed to clear" });
    }
  },
);

export default router;
