import { Request, Response, Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "../db/connection.js";
import { queryToObjects } from "../db/helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

router.get("/latest", (_req: Request, res: Response) => {
  try {
    const modelDir = path.join(__dirname, "..", "..", "data", "trained");
    const modelJsonPath = path.join(modelDir, "model.json");

    if (!fs.existsSync(modelJsonPath)) {
      res
        .status(404)
        .json({ error: "No trained model found. Run training first." });
      return;
    }

    res.sendFile(modelJsonPath);
  } catch (error) {
    console.error("Error serving model:", error);
    res.status(500).json({ error: "Failed to serve model" });
  }
});

router.get("/feature-stats", async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const stats = queryToObjects(
      db,
      "SELECT * FROM feature_stats ORDER BY feature_name",
    );
    res.json({ stats });
  } catch (error) {
    console.error("Error fetching feature stats:", error);
    res.status(500).json({ error: "Failed to fetch feature stats" });
  }
});

router.get("/confusion-matrix", (_req: Request, res: Response) => {
  try {
    const cmPath = path.join(
      __dirname,
      "..",
      "..",
      "data",
      "trained",
      "confusion_matrix.json",
    );

    if (!fs.existsSync(cmPath)) {
      res
        .status(404)
        .json({ error: "No confusion matrix data found. Run training first." });
      return;
    }

    const data = JSON.parse(fs.readFileSync(cmPath, "utf-8"));
    res.json(data);
  } catch (error) {
    console.error("Error serving confusion matrix:", error);
    res.status(500).json({ error: "Failed to serve confusion matrix" });
  }
});

router.get("/learning-curve", (_req: Request, res: Response) => {
  try {
    const curvePath = path.join(
      __dirname,
      "..",
      "..",
      "data",
      "trained",
      "learning_curve.json",
    );

    if (!fs.existsSync(curvePath)) {
      res
        .status(404)
        .json({ error: "No learning curve data found. Run training first." });
      return;
    }

    const data = JSON.parse(fs.readFileSync(curvePath, "utf-8"));
    res.json(data);
  } catch (error) {
    console.error("Error serving learning curve:", error);
    res.status(500).json({ error: "Failed to serve learning curve" });
  }
});

router.get("/metrics", async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const metrics = queryToObjects(
      db,
      "SELECT * FROM training_metrics ORDER BY created_at DESC LIMIT 10",
    );
    res.json({ metrics });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// Catch-all for weight files — MUST be last so it doesn't shadow named routes.
// TF.js resolves weight paths relative to the model.json URL's directory,
// so a model at /api/model/latest with paths:["weights.bin"] becomes
// GET /api/model/weights.bin → this route matches /:filename.
router.get("/:filename", (req: Request, res: Response) => {
  try {
    const raw = req.params.filename;
    const sanitized = path.basename(raw);

    if (sanitized !== raw || !sanitized.endsWith(".bin")) {
      res.status(400).json({ error: "Invalid weight filename" });
      return;
    }

    const modelDir = path.join(__dirname, "..", "..", "data", "trained");
    const weightsPath = path.join(modelDir, sanitized);
    const resolved = path.resolve(weightsPath);

    if (!resolved.startsWith(path.resolve(modelDir))) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (!fs.existsSync(resolved)) {
      res.status(404).json({ error: "Weight file not found" });
      return;
    }

    res.sendFile(resolved);
  } catch (error) {
    console.error("Error serving weights:", error);
    res.status(500).json({ error: "Failed to serve weights" });
  }
});

export default router;
