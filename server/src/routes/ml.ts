import { Request, Response, Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "../db/connection.js";
import { NUM_FEATURES } from "../ml/featureEngineering.js";
import { runTraining, type DatasetSample } from "../ml/trainer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

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

router.get("/feedback-stats", async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const rows = queryToObjects(
      db,
      "SELECT COUNT(*) as count FROM feedback_labels",
    );
    const count = Number((rows[0] as { count: number })?.count ?? 0);
    res.json({ count });
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    res.status(500).json({ error: "Failed to fetch feedback stats" });
  }
});

router.get("/feedback-list", async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const rows = queryToObjects(
      db,
      `SELECT fl.id, fl.incident_id, fl.label, fl.decided_by, fl.decided_at,
              i.user_name, i.action
       FROM feedback_labels fl
       LEFT JOIN incidents i ON i.id = fl.incident_id
       ORDER BY fl.decided_at DESC LIMIT 50`,
    );
    res.json({
      feedbacks: rows.map((r) => ({
        id: r.id,
        incidentId: r.incident_id,
        label: r.label,
        decidedBy: r.decided_by,
        decidedAt: r.decided_at,
        userName: r.user_name,
        action: r.action,
      })),
    });
  } catch (error) {
    console.error("Error fetching feedback list:", error);
    res.status(500).json({ error: "Failed to fetch feedback list" });
  }
});

router.post("/retrain", async (_req: Request, res: Response) => {
  try {
    const datasetPath = path.join(
      __dirname,
      "..",
      "..",
      "data",
      "synthetic",
      "dataset.json",
    );
    if (!fs.existsSync(datasetPath)) {
      res
        .status(400)
        .json({ error: "Synthetic dataset not found", path: datasetPath });
      return;
    }

    const datasetJson = JSON.parse(fs.readFileSync(datasetPath, "utf-8")) as {
      samples: DatasetSample[];
      featureStats?: unknown[];
    };
    if (!datasetJson.samples?.length) {
      res.status(400).json({ error: "Synthetic dataset has no samples" });
      return;
    }

    const db = await getDb();
    const feedbackRows = queryToObjects(
      db,
      "SELECT feature_vector, label FROM feedback_labels ORDER BY id",
    ) as { feature_vector: string; label: number }[];

    const extraSamples: DatasetSample[] = feedbackRows
      .map((row) => {
        try {
          const features = JSON.parse(row.feature_vector) as number[];
          if (!Array.isArray(features) || features.length !== NUM_FEATURES)
            return null;
          return { features, label: Number(row.label) };
        } catch {
          return null;
        }
      })
      .filter((s): s is DatasetSample => s !== null);

    const result = await runTraining({ extraSamples });

    res.json({
      success: true,
      modelVersion: result.modelVersion,
      datasetSize: result.datasetSize,
      trainingTimeMs: result.trainingTimeMs,
      ml: {
        accuracy: result.mlMetrics.accuracy,
        precision: result.mlMetrics.precision,
        recall: result.mlMetrics.recall,
        f1Score: result.mlMetrics.f1Score,
        aucRoc: result.mlMetrics.aucRoc,
      },
      rules: {
        accuracy: result.rulesMetrics.accuracy,
        precision: result.rulesMetrics.precision,
        recall: result.rulesMetrics.recall,
        f1Score: result.rulesMetrics.f1Score,
      },
    });
  } catch (error) {
    console.error("Error during retrain:", error);
    res.status(500).json({
      error: "Retrain failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
