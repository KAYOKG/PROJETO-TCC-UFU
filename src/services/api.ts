import type { Incident, ResolveDecision, SystemLog } from "../types";

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
  if (!res.ok) return null;
  return res.json();
}

export async function fetchConfusionMatrix() {
  const res = await fetch(`${API_BASE}/model/confusion-matrix`);
  if (!res.ok) return null;
  return res.json();
}

export function getModelUrl(): string {
  return `${API_BASE}/model/latest`;
}

export interface CreateIncidentPayload {
  logId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  riskScore: number;
  mlPrediction: number;
  featureVector: number[];
}

export async function createIncident(
  payload: CreateIncidentPayload,
): Promise<{ blocked_until?: string; reason?: string }> {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? "Failed to create incident",
    );
  }
  return res.json();
}

export interface UserBlockResponse {
  blocked: boolean;
  blockedUntil?: string;
  reason?: string;
  status?: string;
}

export async function getUserBlock(userId: string): Promise<UserBlockResponse> {
  const res = await fetch(
    `${API_BASE}/user-blocks/${encodeURIComponent(userId)}`,
  );
  if (!res.ok) return { blocked: false };
  return res.json();
}

export interface UserRiskLevel {
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
    incident?: Incident;
  } | null;
}

export async function getUsersRiskLevels(): Promise<{
  users: UserRiskLevel[];
}> {
  const res = await fetch(`${API_BASE}/users/risk-levels`);
  if (!res.ok) throw new Error("Failed to fetch risk levels");
  return res.json();
}

export async function reportPrediction(body: {
  userId: string;
  riskScore: number;
  logId?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/users/predictions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return;
}

export async function getSessionStatus(
  userId: string,
): Promise<{ valid: boolean }> {
  const res = await fetch(
    `${API_BASE}/users/${encodeURIComponent(userId)}/session-status`,
  );
  if (!res.ok) return { valid: true };
  return res.json();
}

export async function clearSessionInvalidation(userId: string): Promise<void> {
  await fetch(
    `${API_BASE}/users/${encodeURIComponent(userId)}/clear-session-invalidation`,
    { method: "POST" },
  );
}

export async function getIncidents(params?: {
  status?: string;
}): Promise<{ incidents: Incident[] }> {
  const query = params?.status
    ? `?status=${encodeURIComponent(params.status)}`
    : "";
  const res = await fetch(`${API_BASE}/incidents${query}`);
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function resolveIncident(
  id: number,
  body: { decision: ResolveDecision; admin_notes?: string; decided_by: string },
): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/${id}/resolve`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? "Failed to resolve incident",
    );
  }
  return res.json();
}

export async function getFeedbackStats(): Promise<{ count: number }> {
  const res = await fetch(`${API_BASE}/ml/feedback-stats`);
  if (!res.ok) throw new Error("Failed to fetch feedback stats");
  return res.json();
}

export interface FeedbackItem {
  id: number;
  incidentId: number;
  label: number;
  decidedBy: string;
  decidedAt: string;
  userName: string;
  action: string;
}

export async function getFeedbackList(): Promise<{
  feedbacks: FeedbackItem[];
}> {
  const res = await fetch(`${API_BASE}/ml/feedback-list`);
  if (!res.ok) throw new Error("Failed to fetch feedback list");
  return res.json();
}

export async function fetchLogs(params: {
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: Array<Record<string, unknown>>; total: number }> {
  const q = new URLSearchParams();
  if (params.userId) q.set("userId", params.userId);
  if (params.limit != null) q.set("limit", String(params.limit));
  if (params.offset != null) q.set("offset", String(params.offset));
  const res = await fetch(`${API_BASE}/logs?${q}`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function retrainModel(): Promise<{
  success: boolean;
  modelVersion: string;
  datasetSize: number;
  trainingTimeMs: number;
  ml: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    aucRoc: number;
  };
  rules: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}> {
  const res = await fetch(`${API_BASE}/ml/retrain`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string; message?: string }).error ??
        (err as { message?: string }).message ??
        "Retrain failed",
    );
  }
  return res.json();
}
