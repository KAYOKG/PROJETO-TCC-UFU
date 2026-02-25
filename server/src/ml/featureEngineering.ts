/**
 * Feature Engineering Pipeline - Backend (completo)
 *
 * Transforma logs brutos em vetores numéricos de 30 features para o modelo ML.
 * Categorias: Ambiente, Comportamento, Contexto (conforme monografia).
 */

export const FEATURE_NAMES = [
  'hourOfDay', 'dayOfWeek', 'accessLevelEncoded',
  'actionTypeCreate', 'actionTypeRead', 'actionTypeUpdate',
  'actionTypeDelete', 'actionTypeLogin', 'actionTypeConfig',
  'moduleClientes', 'moduleEmpresa', 'moduleContratos',
  'moduleGestao', 'moduleSistema', 'resultEncoded',
  'sessionDurationMinutes', 'actionFrequency', 'actionVariety',
  'actionSequenceEntropy', 'moduleAccessCount', 'sensitiveDataAccessCount',
  'errorRate', 'avgTimeBetweenActions', 'burstScore',
  'networkLatency', 'geoDistanceFromUsual', 'ipChangeFlag',
  'loginAttempts', 'inactivitySeconds', 'isNewDevice',
] as const;

export const NUM_FEATURES = FEATURE_NAMES.length;

export interface RawLogRow {
  id: string;
  timestamp: string;
  user_name: string;
  user_id: string;
  access_level: string;
  action: string;
  details: string;
  module: string | null;
  device: string | null;
  browser: string | null;
  ip_address: string | null;
  geo_latitude: number | null;
  geo_longitude: number | null;
  network_latency: number | null;
  network_type: string | null;
  session_start_time: string | null;
  session_login_attempts: number;
  session_inactivity_time: number;
  result: string;
}

export interface FeatureStats {
  featureName: string;
  min: number;
  max: number;
  mean: number;
  std: number;
}

// --- Encoding helpers ---

function encodeAccessLevel(level: string): number {
  const map: Record<string, number> = { system: 0, guest: 1, user: 2, admin: 3 };
  return map[level] ?? 0;
}

function classifyAction(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('cadastro') || lower.includes('criação') || lower.includes('criaç')) return 'create';
  if (lower.includes('visualiz') || lower.includes('consulta') || lower.includes('listagem')) return 'read';
  if (lower.includes('edição') || lower.includes('ediç') || lower.includes('atualização') || lower.includes('atualizaç') || lower.includes('status')) return 'update';
  if (lower.includes('exclusão') || lower.includes('exclus') || lower.includes('remov')) return 'delete';
  if (lower.includes('login') || lower.includes('autenticação') || lower.includes('autenticaç')) return 'login';
  if (lower.includes('configuração') || lower.includes('configuraç') || lower.includes('inatividade')) return 'config';
  if (lower.includes('interação') || lower.includes('interaç')) return 'read';
  return 'read';
}

function classifyModule(module: string | null): string {
  if (!module) return 'sistema';
  const lower = module.toLowerCase();
  if (lower.includes('cliente')) return 'clientes';
  if (lower.includes('empresa')) return 'empresa';
  if (lower.includes('contrato') && lower.includes('gestão')) return 'gestao';
  if (lower.includes('contrato')) return 'contratos';
  return 'sistema';
}

const SENSITIVE_MODULES = new Set(['contratos', 'gestao']);

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function shannonEntropy(counts: Map<string, number>, total: number): number {
  if (total === 0) return 0;
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  return entropy;
}

// --- Main feature extraction ---

interface UserHistory {
  usualLat: number | null;
  usualLon: number | null;
  usualIp: string | null;
  knownDevices: Set<string>;
}

export function buildUserHistories(logs: RawLogRow[]): Map<string, UserHistory> {
  const histories = new Map<string, UserHistory>();

  for (const log of logs) {
    let h = histories.get(log.user_id);
    if (!h) {
      h = { usualLat: null, usualLon: null, usualIp: null, knownDevices: new Set() };
      histories.set(log.user_id, h);
    }
    if (log.geo_latitude != null && h.usualLat == null) {
      h.usualLat = log.geo_latitude;
      h.usualLon = log.geo_longitude;
    }
    if (log.ip_address && !h.usualIp) {
      h.usualIp = log.ip_address;
    }
    if (log.device) {
      h.knownDevices.add(log.device);
    }
  }

  return histories;
}

export function extractFeatures(
  log: RawLogRow,
  recentLogs: RawLogRow[],
  userHistory: UserHistory | undefined,
): number[] {
  const ts = new Date(log.timestamp);

  // Environment features
  const hourOfDay = ts.getHours();
  const dayOfWeek = ts.getDay();
  const accessLevelEncoded = encodeAccessLevel(log.access_level);

  const actionClass = classifyAction(log.action);
  const actionTypeCreate = actionClass === 'create' ? 1 : 0;
  const actionTypeRead = actionClass === 'read' ? 1 : 0;
  const actionTypeUpdate = actionClass === 'update' ? 1 : 0;
  const actionTypeDelete = actionClass === 'delete' ? 1 : 0;
  const actionTypeLogin = actionClass === 'login' ? 1 : 0;
  const actionTypeConfig = actionClass === 'config' ? 1 : 0;

  const mod = classifyModule(log.module);
  const moduleClientes = mod === 'clientes' ? 1 : 0;
  const moduleEmpresa = mod === 'empresa' ? 1 : 0;
  const moduleContratos = mod === 'contratos' ? 1 : 0;
  const moduleGestao = mod === 'gestao' ? 1 : 0;
  const moduleSistema = mod === 'sistema' ? 1 : 0;

  const resultEncoded = log.result === 'success' ? 1 : 0;

  const sessionStart = log.session_start_time ? new Date(log.session_start_time) : ts;
  const sessionDurationMinutes = Math.max(0, (ts.getTime() - sessionStart.getTime()) / 60000);

  // Behavioral features (computed over recent logs window)
  const userRecentLogs = recentLogs.filter(l => l.user_id === log.user_id);
  const actionFrequency = userRecentLogs.length;

  const actionTypes = new Set(userRecentLogs.map(l => classifyAction(l.action)));
  const actionVariety = actionTypes.size;

  const actionCounts = new Map<string, number>();
  for (const l of userRecentLogs) {
    const a = classifyAction(l.action);
    actionCounts.set(a, (actionCounts.get(a) || 0) + 1);
  }
  const actionSequenceEntropy = shannonEntropy(actionCounts, userRecentLogs.length);

  const modulesAccessed = new Set(userRecentLogs.map(l => classifyModule(l.module)));
  const moduleAccessCount = modulesAccessed.size;

  const sensitiveDataAccessCount = userRecentLogs.filter(l =>
    SENSITIVE_MODULES.has(classifyModule(l.module))
  ).length;

  const errors = userRecentLogs.filter(l => l.result === 'error').length;
  const errorRate = userRecentLogs.length > 0 ? errors / userRecentLogs.length : 0;

  let avgTimeBetweenActions = 0;
  if (userRecentLogs.length > 1) {
    const sorted = userRecentLogs
      .map(l => new Date(l.timestamp).getTime())
      .sort((a, b) => a - b);
    const diffs = sorted.slice(1).map((t, i) => t - sorted[i]);
    avgTimeBetweenActions = diffs.reduce((a, b) => a + b, 0) / diffs.length / 1000;
  }

  // Burst: how many actions in the last 60 seconds
  const oneMinAgo = ts.getTime() - 60000;
  const burstScore = userRecentLogs.filter(l => new Date(l.timestamp).getTime() >= oneMinAgo).length;

  // Context features
  const networkLatency = log.network_latency ?? 0;

  let geoDistanceFromUsual = 0;
  if (userHistory?.usualLat != null && log.geo_latitude != null) {
    geoDistanceFromUsual = haversineDistance(
      userHistory.usualLat, userHistory.usualLon!,
      log.geo_latitude, log.geo_longitude!,
    );
  }

  const ipChangeFlag = (userHistory?.usualIp && log.ip_address && userHistory.usualIp !== log.ip_address) ? 1 : 0;
  const loginAttempts = log.session_login_attempts;
  const inactivitySeconds = (log.session_inactivity_time ?? 0) / 1000;
  const isNewDevice = (log.device && userHistory?.knownDevices && !userHistory.knownDevices.has(log.device)) ? 1 : 0;

  return [
    hourOfDay, dayOfWeek, accessLevelEncoded,
    actionTypeCreate, actionTypeRead, actionTypeUpdate,
    actionTypeDelete, actionTypeLogin, actionTypeConfig,
    moduleClientes, moduleEmpresa, moduleContratos,
    moduleGestao, moduleSistema, resultEncoded,
    sessionDurationMinutes, actionFrequency, actionVariety,
    actionSequenceEntropy, moduleAccessCount, sensitiveDataAccessCount,
    errorRate, avgTimeBetweenActions, burstScore,
    networkLatency, geoDistanceFromUsual, ipChangeFlag,
    loginAttempts, inactivitySeconds, isNewDevice,
  ];
}

// --- Normalization ---

export function computeFeatureStats(featureMatrix: number[][]): FeatureStats[] {
  if (featureMatrix.length === 0) return [];
  const numFeatures = featureMatrix[0].length;
  const stats: FeatureStats[] = [];

  for (let j = 0; j < numFeatures; j++) {
    const col = featureMatrix.map(row => row[j]);
    const min = Math.min(...col);
    const max = Math.max(...col);
    const mean = col.reduce((a, b) => a + b, 0) / col.length;
    const variance = col.reduce((a, b) => a + (b - mean) ** 2, 0) / col.length;
    const std = Math.sqrt(variance);

    stats.push({
      featureName: FEATURE_NAMES[j],
      min, max, mean, std,
    });
  }

  return stats;
}

export function normalizeFeatures(featureMatrix: number[][], stats: FeatureStats[]): number[][] {
  return featureMatrix.map(row =>
    row.map((val, j) => {
      const range = stats[j].max - stats[j].min;
      if (range === 0) return 0;
      return (val - stats[j].min) / range;
    })
  );
}

export function normalizeSingleVector(vector: number[], stats: FeatureStats[]): number[] {
  return vector.map((val, j) => {
    const range = stats[j].max - stats[j].min;
    if (range === 0) return 0;
    return Math.max(0, Math.min(1, (val - stats[j].min) / range));
  });
}
