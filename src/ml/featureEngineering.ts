/**
 * Feature Engineering - Frontend (simplificado para inferência real-time)
 *
 * Calcula o vetor de features a partir dos logs em memória (sessão atual).
 */

import {
  FEATURE_NAMES,
  FeatureStats,
  FeatureVector,
  NUM_FEATURES,
  SystemLog,
} from "../types";

function encodeAccessLevel(level: string): number {
  const map: Record<string, number> = {
    system: 0,
    guest: 1,
    user: 2,
    admin: 3,
  };
  return map[level] ?? 0;
}

/** Sincronizado com server/src/ml/featureEngineering.ts para mesmo vetor treino/inferência */
function classifyAction(action: string): string {
  const lower = action.toLowerCase();
  if (
    lower.includes("cadastro") ||
    lower.includes("criação") ||
    lower.includes("criaç")
  )
    return "create";
  if (
    lower.includes("visualiz") ||
    lower.includes("consulta") ||
    lower.includes("listagem")
  )
    return "read";
  if (
    lower.includes("edição") ||
    lower.includes("ediç") ||
    lower.includes("atualização") ||
    lower.includes("atualizaç") ||
    lower.includes("status")
  )
    return "update";
  if (
    lower.includes("exclusão") ||
    lower.includes("exclus") ||
    lower.includes("remov")
  )
    return "delete";
  if (
    lower.includes("login") ||
    lower.includes("autenticação") ||
    lower.includes("autenticaç")
  )
    return "login";
  if (
    lower.includes("configuração") ||
    lower.includes("configuraç") ||
    lower.includes("inatividade")
  )
    return "config";
  if (lower.includes("interação") || lower.includes("interaç")) return "read";
  return "read";
}

/** Sincronizado com server/src/ml/featureEngineering.ts */
function classifyModule(module: string | null | undefined): string {
  if (!module) return "sistema";
  const lower = module.toLowerCase();
  if (lower.includes("cliente")) return "clientes";
  if (lower.includes("empresa")) return "empresa";
  if (lower.includes("contrato") && lower.includes("gestão")) return "gestao";
  if (lower.includes("contrato")) return "contratos";
  return "sistema";
}

const SENSITIVE_MODULES = new Set(["contratos", "gestao"]);

function shannonEntropy(counts: Map<string, number>, total: number): number {
  if (total === 0) return 0;
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  return entropy;
}

export function extractFeaturesFromLog(
  log: SystemLog,
  recentLogs: SystemLog[],
): FeatureVector {
  const ts =
    log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);

  const hourOfDay = ts.getHours();
  const dayOfWeek = ts.getDay();
  const accessLevelEncoded = encodeAccessLevel(log.accessLevel);

  const actionClass = classifyAction(log.action);

  const mod = classifyModule(log.origin.module);

  const resultEncoded = log.result === "success" ? 1 : 0;

  const sessionStart =
    log.session.startTime instanceof Date
      ? log.session.startTime
      : new Date(log.session.startTime);
  const sessionDurationMinutes = Math.max(
    0,
    (ts.getTime() - sessionStart.getTime()) / 60000,
  );

  const userLogs = recentLogs.filter((l) => l.userId === log.userId);
  const actionFrequency = userLogs.length;

  const actionTypes = new Set(userLogs.map((l) => classifyAction(l.action)));
  const actionVariety = actionTypes.size;

  const actionCounts = new Map<string, number>();
  for (const l of userLogs) {
    const a = classifyAction(l.action);
    actionCounts.set(a, (actionCounts.get(a) || 0) + 1);
  }
  const actionSequenceEntropy = shannonEntropy(actionCounts, userLogs.length);

  const modulesAccessed = new Set(
    userLogs.map((l) => classifyModule(l.origin.module)),
  );
  const moduleAccessCount = modulesAccessed.size;

  const sensitiveDataAccessCount = userLogs.filter((l) =>
    SENSITIVE_MODULES.has(classifyModule(l.origin.module)),
  ).length;

  const errors = userLogs.filter((l) => l.result === "error").length;
  const errorRate = userLogs.length > 0 ? errors / userLogs.length : 0;

  let avgTimeBetweenActions = 0;
  if (userLogs.length > 1) {
    const sorted = userLogs
      .map((l) =>
        (l.timestamp instanceof Date
          ? l.timestamp
          : new Date(l.timestamp)
        ).getTime(),
      )
      .sort((a, b) => a - b);
    const diffs = sorted.slice(1).map((t, i) => t - sorted[i]);
    avgTimeBetweenActions =
      diffs.reduce((a, b) => a + b, 0) / diffs.length / 1000;
  }

  const oneMinAgo = ts.getTime() - 60000;
  const burstScore = userLogs.filter(
    (l) =>
      (l.timestamp instanceof Date
        ? l.timestamp
        : new Date(l.timestamp)
      ).getTime() >= oneMinAgo,
  ).length;

  const networkLatency = log.origin.network?.latency ?? 0;
  const geoDistanceFromUsual = 0;
  const ipChangeFlag = 0;
  const loginAttempts = log.session.loginAttempts;
  const inactivitySeconds = (log.session.inactivityTime ?? 0) / 1000;
  const isNewDevice = 0;

  return {
    hourOfDay,
    dayOfWeek,
    accessLevelEncoded,
    actionTypeCreate: actionClass === "create" ? 1 : 0,
    actionTypeRead: actionClass === "read" ? 1 : 0,
    actionTypeUpdate: actionClass === "update" ? 1 : 0,
    actionTypeDelete: actionClass === "delete" ? 1 : 0,
    actionTypeLogin: actionClass === "login" ? 1 : 0,
    actionTypeConfig: actionClass === "config" ? 1 : 0,
    moduleClientes: mod === "clientes" ? 1 : 0,
    moduleEmpresa: mod === "empresa" ? 1 : 0,
    moduleContratos: mod === "contratos" ? 1 : 0,
    moduleGestao: mod === "gestao" ? 1 : 0,
    moduleSistema: mod === "sistema" ? 1 : 0,
    resultEncoded,
    sessionDurationMinutes,
    actionFrequency,
    actionVariety,
    actionSequenceEntropy,
    moduleAccessCount,
    sensitiveDataAccessCount,
    errorRate,
    avgTimeBetweenActions,
    burstScore,
    networkLatency,
    geoDistanceFromUsual,
    ipChangeFlag,
    loginAttempts,
    inactivitySeconds,
    isNewDevice,
  };
}

export function featureVectorToArray(fv: FeatureVector): number[] {
  return FEATURE_NAMES.map((name) => fv[name]);
}

export function normalizeVector(
  vector: number[],
  stats: FeatureStats[],
): number[] {
  if (stats.length !== NUM_FEATURES) return vector;
  return vector.map((val, i) => {
    const range = stats[i].max - stats[i].min;
    if (range === 0) return 0;
    return Math.max(0, Math.min(1, (val - stats[i].min) / range));
  });
}
