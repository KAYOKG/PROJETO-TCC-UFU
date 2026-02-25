import { SystemLog } from "../types";

const API_BASE = "http://localhost:3001/api";

function serializeLog(log: SystemLog) {
  return {
    ...log,
    timestamp:
      log.timestamp instanceof Date
        ? log.timestamp.toISOString()
        : log.timestamp,
    session: {
      ...log.session,
      startTime:
        log.session.startTime instanceof Date
          ? log.session.startTime.toISOString()
          : log.session.startTime,
      lastActivity:
        log.session.lastActivity instanceof Date
          ? log.session.lastActivity.toISOString()
          : log.session.lastActivity,
    },
  };
}

export async function persistLog(log: SystemLog): Promise<void> {
  try {
    await fetch(`${API_BASE}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serializeLog(log)),
    });
  } catch {
    // Silently fail - logs are still kept in memory
  }
}

export async function persistLogsBatch(logs: SystemLog[]): Promise<void> {
  try {
    await fetch(`${API_BASE}/logs/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logs.map(serializeLog)),
    });
  } catch {
    // Silently fail
  }
}

export async function fetchAlerts(params?: {
  userId?: string;
  minScore?: number;
}) {
  const query = new URLSearchParams();
  if (params?.userId) query.set("userId", params.userId);
  if (params?.minScore) query.set("minScore", String(params.minScore));
  const res = await fetch(`${API_BASE}/alerts?${query}`);
  return res.json();
}

export async function fetchAlertsSummary() {
  const res = await fetch(`${API_BASE}/alerts/summary`);
  return res.json();
}

export async function fetchLogStats() {
  const res = await fetch(`${API_BASE}/logs/stats`);
  return res.json();
}

export async function fetchTrainingMetrics() {
  const res = await fetch(`${API_BASE}/model/metrics`);
  return res.json();
}

export async function fetchFeatureStats() {
  const res = await fetch(`${API_BASE}/model/feature-stats`);
  return res.json();
}

export async function fetchLearningCurve() {
  const res = await fetch(`${API_BASE}/model/learning-curve`);
  return res.json();
}

export async function fetchConfusionMatrix() {
  const res = await fetch(`${API_BASE}/model/confusion-matrix`);
  return res.json();
}

export function getModelUrl(): string {
  return `${API_BASE}/model/latest`;
}
