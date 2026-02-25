import cors from "cors";
import express from "express";
import { closeDb } from "./db/connection.js";
import { initializeDatabase } from "./db/schema.js";
import alertsRouter from "./routes/alerts.js";
import logsRouter from "./routes/logs.js";
import modelRouter from "./routes/model.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
  }),
);
app.use(express.json({ limit: "10mb" }));

async function start() {
  await initializeDatabase();
  console.log("Database initialized");

  app.use("/api/logs", logsRouter);
  app.use("/api/alerts", alertsRouter);
  app.use("/api/model", modelRouter);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const server = app.listen(PORT, () => {
    console.log(`RAA Server running on http://localhost:${PORT}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Kill the other process or set a different PORT env var.`,
      );
    } else {
      console.error("Server error:", err);
    }
    closeDb();
    server.close(() => {
      process.exitCode = 1;
    });
  });

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("\nShutting down...");
    closeDb();
    server.close(() => {
      process.exitCode = 0;
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch(console.error);
