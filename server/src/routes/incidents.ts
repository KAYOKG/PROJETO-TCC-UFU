import { Request, Response, Router } from "express";
import { getDb, saveDb } from "../db/connection.js";

const router = Router();
const BLOCK_DURATION_MS = 3 * 60 * 1000;

function queryToObjects(
  db: Awaited<ReturnType<typeof getDb>>,
  sql: string,
  params: unknown[] = [],
) {
  const results = db.exec(sql, params as number[] | string[]);
  if (results.length === 0) return [];
  return results[0].values.map((row) => {
    const obj: Record<string, unknown> = {};
    results[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      logId,
      userId,
      userName,
      action,
      details,
      riskScore,
      mlPrediction,
      featureVector,
    } = req.body as {
      logId: string;
      userId: string;
      userName: string;
      action: string;
      details: string;
      riskScore: number;
      mlPrediction: number;
      featureVector: number[];
    };

    if (!userId || !userName || action == null || riskScore == null) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // SuperAdmin é o observador, nunca o observado: rejeitar incidentes dele
    if (String(userId).toLowerCase() === "superadmin") {
      res
        .status(400)
        .json({ error: "Incidents for SuperAdmin are not allowed" });
      return;
    }

    const db = await getDb();
    const now = new Date();
    const blockedUntil = new Date(
      now.getTime() + BLOCK_DURATION_MS,
    ).toISOString();
    const reason =
      "Atividade incomum detectada pelo modelo de ML. Aguarde revisão do administrador.";

    db.run(
      `INSERT INTO incidents (
        log_id, user_id, user_name, action, details, risk_score, ml_prediction,
        feature_vector, status, blocked_until
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        logId ?? null,
        userId,
        userName,
        action,
        details ?? "",
        riskScore,
        mlPrediction ?? riskScore,
        featureVector ? JSON.stringify(featureVector) : null,
        blockedUntil,
      ],
    );

    const idResult = db.exec("SELECT last_insert_rowid() as id");
    const incidentId =
      idResult.length > 0 && idResult[0].values[0]
        ? (idResult[0].values[0][0] as number)
        : 0;

    // SuperAdmin nunca é bloqueado: pode receber alertas, mas a sessão não é suspensa
    const isSuperAdmin =
      String(userId).toLowerCase() === "superadmin" ||
      String(userName).toLowerCase() === "superadmin";
    if (!isSuperAdmin) {
      db.run(
        `INSERT INTO user_blocks (user_id, blocked_until, reason, incident_id, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [userId, blockedUntil, reason, incidentId],
      );
    }

    saveDb();

    const incident = queryToObjects(
      db,
      `SELECT * FROM incidents WHERE id = ${Number(incidentId)}`,
    )[0];
    res.status(201).json({
      ...incident,
      blocked_until: blockedUntil,
      reason,
    });
  } catch (error) {
    console.error("Error creating incident:", error);
    res.status(500).json({ error: "Failed to create incident" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { status } = req.query;

    let query = "SELECT * FROM incidents WHERE 1=1";
    const params: unknown[] = [];

    if (status && typeof status === "string") {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";
    const incidents = queryToObjects(db, query, params);
    res.json({ incidents });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

router.put("/:id/resolve", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { decision, admin_notes, decided_by } = req.body as {
      decision: "confirm_threat" | "clear";
      admin_notes?: string;
      decided_by: string;
    };

    if (
      !decision ||
      !decided_by ||
      !["confirm_threat", "clear"].includes(decision)
    ) {
      res.status(400).json({ error: "Invalid decision or missing decided_by" });
      return;
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const incidentRows = queryToObjects(
      db,
      `SELECT * FROM incidents WHERE id = ${Number(id)}`,
    );
    const incident = incidentRows[0] as
      | {
          id: number;
          user_id: string;
          feature_vector: string | null;
          status: string;
        }
      | undefined;

    if (!incident) {
      res.status(404).json({ error: "Incident not found" });
      return;
    }

    if (incident.status !== "pending") {
      res.status(400).json({ error: "Incident already resolved" });
      return;
    }

    const featureVector = incident.feature_vector
      ? (JSON.parse(incident.feature_vector) as number[])
      : null;
    const label = decision === "confirm_threat" ? 1 : 0;

    db.run(
      `UPDATE incidents SET status = ?, admin_decision = ?, admin_notes = ?, resolved_at = ?
       WHERE id = ?`,
      [
        decision === "confirm_threat" ? "confirmed_threat" : "cleared",
        decision,
        admin_notes ?? null,
        now,
        id,
      ],
    );

    if (featureVector && featureVector.length > 0) {
      db.run(
        `INSERT INTO feedback_labels (incident_id, feature_vector, label, decided_by)
         VALUES (?, ?, ?, ?)`,
        [id, JSON.stringify(featureVector), label, decided_by],
      );
    }

    if (decision === "clear") {
      db.run(
        `UPDATE user_blocks SET status = 'manually_unblocked', unblocked_by = ?, unblocked_at = ?
         WHERE incident_id = ? AND status = 'active'`,
        [decided_by, now, id],
      );
    }
    if (decision === "confirm_threat") {
      db.run(
        `INSERT OR REPLACE INTO session_invalidations (user_id, invalidated_at) VALUES (?, ?)`,
        [incident.user_id, now],
      );
    }

    saveDb();

    const updated = queryToObjects(
      db,
      `SELECT * FROM incidents WHERE id = ${Number(id)}`,
    )[0];
    res.json(updated);
  } catch (error) {
    console.error("Error resolving incident:", error);
    res.status(500).json({ error: "Failed to resolve incident" });
  }
});

export default router;
