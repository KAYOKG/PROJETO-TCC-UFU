/**
 * Synthetic Dataset Generator
 *
 * Gera dados rotulados (normal=0 / suspeito=1) simulando perfis de uso do ERP.
 * Perfis baseados nas ameaças definidas na monografia:
 * - Normal Office Worker, Normal Manager
 * - Suspeito: Data Exfiltration, Privilege Escalation, Account Compromise, Insider Threat
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb, saveDb } from "../db/connection.js";
import { initializeDatabase } from "../db/schema.js";
import {
  FEATURE_NAMES,
  NUM_FEATURES,
  buildUserHistories,
  computeFeatureStats,
  extractFeatures,
  normalizeFeatures,
  type FeatureStats,
  type RawLogRow,
} from "./featureEngineering.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Random helpers ---

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function gaussianNoise(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function weightedPick<T>(arr: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

// --- Profile definitions ---

interface UserProfile {
  label: 0 | 1;
  userId: string;
  userName: string;
  accessLevel: string;
  hourRange: [number, number];
  actionsPerSession: [number, number];
  actionWeights: Record<string, number>;
  moduleWeights: Record<string, number>;
  errorProbability: number;
  ipVariation: boolean;
  geoVariation: boolean;
  deviceVariation: boolean;
  loginAttemptRange: [number, number];
  inactivityRange: [number, number];
  burstProbability: number;
  sessionDurationRange: [number, number];
}

const MODULES = [
  "Clientes",
  "Empresa",
  "Contratos",
  "Gestão de Contratos",
  "Sistema",
];
const ACTIONS: Record<string, string[]> = {
  Clientes: [
    "Cadastro de Cliente",
    "Edição de Cliente",
    "Exclusão de Cliente",
    "Listagem de Clientes",
    "Visualização de Cliente",
  ],
  Empresa: [
    "Cadastro de Empresa",
    "Atualização de Empresa",
    "Visualização de Empresa",
  ],
  Contratos: ["Criação de Contrato", "Visualização de Contrato"],
  "Gestão de Contratos": [
    "Atualização de Status",
    "Exclusão de Contrato",
    "Listagem de Contratos",
  ],
  Sistema: [
    "Interação do Usuário - click",
    "Interação do Usuário - navigation",
    "Inatividade Detectada",
  ],
};
const DEVICES = ["Win32", "MacIntel", "Linux x86_64"];
const BROWSERS = [
  "Mozilla/5.0 Chrome/120",
  "Mozilla/5.0 Firefox/121",
  "Mozilla/5.0 Safari/17",
];
const BASE_IPS = ["192.168.1.", "10.0.0.", "172.16.0."];

function createNormalWorker(id: number): UserProfile {
  return {
    label: 0,
    userId: `user-${id}`,
    userName: `Funcionário ${id}`,
    accessLevel: "user",
    hourRange: [8, 18],
    actionsPerSession: [15, 40],
    actionWeights: {
      Clientes: 5,
      Empresa: 1,
      Contratos: 2,
      "Gestão de Contratos": 1,
      Sistema: 3,
    },
    moduleWeights: {
      Clientes: 5,
      Empresa: 1,
      Contratos: 2,
      "Gestão de Contratos": 1,
      Sistema: 3,
    },
    errorProbability: 0.02,
    ipVariation: false,
    geoVariation: false,
    deviceVariation: false,
    loginAttemptRange: [1, 1],
    inactivityRange: [0, 120000],
    burstProbability: 0.05,
    sessionDurationRange: [30, 480],
  };
}

function createNormalManager(id: number): UserProfile {
  return {
    label: 0,
    userId: `admin-${id}`,
    userName: `Gerente ${id}`,
    accessLevel: "admin",
    hourRange: [7, 20],
    actionsPerSession: [20, 60],
    actionWeights: {
      Clientes: 3,
      Empresa: 3,
      Contratos: 4,
      "Gestão de Contratos": 4,
      Sistema: 2,
    },
    moduleWeights: {
      Clientes: 3,
      Empresa: 3,
      Contratos: 4,
      "Gestão de Contratos": 4,
      Sistema: 2,
    },
    errorProbability: 0.01,
    ipVariation: false,
    geoVariation: false,
    deviceVariation: false,
    loginAttemptRange: [1, 2],
    inactivityRange: [0, 180000],
    burstProbability: 0.08,
    sessionDurationRange: [60, 600],
  };
}

function createDataExfiltration(id: number): UserProfile {
  return {
    label: 1,
    userId: `user-exfil-${id}`,
    userName: `Exfiltrador ${id}`,
    accessLevel: "user",
    hourRange: [22, 5],
    actionsPerSession: [60, 150],
    actionWeights: {
      Clientes: 8,
      Empresa: 1,
      Contratos: 8,
      "Gestão de Contratos": 6,
      Sistema: 1,
    },
    moduleWeights: {
      Clientes: 8,
      Empresa: 1,
      Contratos: 8,
      "Gestão de Contratos": 6,
      Sistema: 1,
    },
    errorProbability: 0.05,
    ipVariation: false,
    geoVariation: false,
    deviceVariation: false,
    loginAttemptRange: [1, 2],
    inactivityRange: [0, 30000],
    burstProbability: 0.7,
    sessionDurationRange: [10, 120],
  };
}

function createPrivilegeEscalation(id: number): UserProfile {
  return {
    label: 1,
    userId: `user-privesc-${id}`,
    userName: `PrivEsc ${id}`,
    accessLevel: "guest",
    hourRange: [10, 22],
    actionsPerSession: [30, 80],
    actionWeights: {
      Clientes: 2,
      Empresa: 4,
      Contratos: 5,
      "Gestão de Contratos": 6,
      Sistema: 4,
    },
    moduleWeights: {
      Clientes: 2,
      Empresa: 4,
      Contratos: 5,
      "Gestão de Contratos": 6,
      Sistema: 4,
    },
    errorProbability: 0.35,
    ipVariation: false,
    geoVariation: false,
    deviceVariation: false,
    loginAttemptRange: [3, 8],
    inactivityRange: [0, 60000],
    burstProbability: 0.3,
    sessionDurationRange: [15, 240],
  };
}

function createAccountCompromise(id: number): UserProfile {
  return {
    label: 1,
    userId: `user-compromised-${id}`,
    userName: `Comprometido ${id}`,
    accessLevel: "admin",
    hourRange: [0, 23],
    actionsPerSession: [25, 70],
    actionWeights: {
      Clientes: 3,
      Empresa: 2,
      Contratos: 5,
      "Gestão de Contratos": 5,
      Sistema: 2,
    },
    moduleWeights: {
      Clientes: 3,
      Empresa: 2,
      Contratos: 5,
      "Gestão de Contratos": 5,
      Sistema: 2,
    },
    errorProbability: 0.1,
    ipVariation: true,
    geoVariation: true,
    deviceVariation: true,
    loginAttemptRange: [2, 6],
    inactivityRange: [0, 300000],
    burstProbability: 0.4,
    sessionDurationRange: [5, 180],
  };
}

function createInsiderThreat(id: number): UserProfile {
  return {
    label: 1,
    userId: `user-insider-${id}`,
    userName: `Insider ${id}`,
    accessLevel: "admin",
    hourRange: [20, 6],
    actionsPerSession: [40, 100],
    actionWeights: {
      Clientes: 2,
      Empresa: 1,
      Contratos: 7,
      "Gestão de Contratos": 8,
      Sistema: 1,
    },
    moduleWeights: {
      Clientes: 2,
      Empresa: 1,
      Contratos: 7,
      "Gestão de Contratos": 8,
      Sistema: 1,
    },
    errorProbability: 0.03,
    ipVariation: false,
    geoVariation: false,
    deviceVariation: false,
    loginAttemptRange: [1, 2],
    inactivityRange: [0, 60000],
    burstProbability: 0.5,
    sessionDurationRange: [30, 360],
  };
}

// --- Log generation ---

function generateHour(range: [number, number]): number {
  if (range[0] <= range[1]) {
    return randInt(range[0], range[1]);
  }
  // Wraps around midnight
  const h = randInt(range[0], range[1] + 24);
  return h % 24;
}

function generateSessionLogs(profile: UserProfile): RawLogRow[] {
  const numActions = randInt(
    profile.actionsPerSession[0],
    profile.actionsPerSession[1],
  );
  const logs: RawLogRow[] = [];
  const baseDate = new Date(2025, randInt(0, 11), randInt(1, 28));
  const hour = generateHour(profile.hourRange);
  const startMinute = randInt(0, 59);

  const sessionStart = new Date(baseDate);
  sessionStart.setHours(hour, startMinute, 0, 0);

  const sessionDuration =
    randInt(profile.sessionDurationRange[0], profile.sessionDurationRange[1]) *
    60000;
  const device = pick(DEVICES);
  const browser = pick(BROWSERS);
  const baseIp = pick(BASE_IPS) + randInt(1, 254);
  const baseLat = gaussianNoise(-18.92, 0.01);
  const baseLon = gaussianNoise(-48.27, 0.01);

  const modules = Object.keys(profile.moduleWeights);
  const moduleWeightValues = modules.map((m) => profile.moduleWeights[m]);

  for (let i = 0; i < numActions; i++) {
    const timeOffset = Math.min(
      (i / numActions) * sessionDuration + gaussianNoise(0, 5000),
      sessionDuration,
    );
    const ts = new Date(sessionStart.getTime() + Math.max(0, timeOffset));

    const isBurst = Math.random() < profile.burstProbability;
    if (isBurst && i > 0) {
      ts.setTime(
        new Date(logs[logs.length - 1].timestamp).getTime() +
          randInt(500, 3000),
      );
    }

    const mod = weightedPick(modules, moduleWeightValues);
    const moduleActions = ACTIONS[mod] || ["Interação do Usuário - click"];
    const action = pick(moduleActions);
    const isError = Math.random() < profile.errorProbability;

    const currentDevice =
      profile.deviceVariation && Math.random() < 0.5 ? pick(DEVICES) : device;
    const currentIp =
      profile.ipVariation && Math.random() < 0.5
        ? pick(BASE_IPS) + randInt(1, 254)
        : baseIp;
    const currentLat =
      profile.geoVariation && Math.random() < 0.3
        ? gaussianNoise(baseLat + randFloat(-5, 5), 0.5)
        : gaussianNoise(baseLat, 0.005);
    const currentLon =
      profile.geoVariation && Math.random() < 0.3
        ? gaussianNoise(baseLon + randFloat(-5, 5), 0.5)
        : gaussianNoise(baseLon, 0.005);

    logs.push({
      id: `synth-${profile.userId}-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: ts.toISOString(),
      user_name: profile.userName,
      user_id: profile.userId,
      access_level: profile.accessLevel,
      action,
      details: `${action} - dados simulados`,
      module: mod,
      device: currentDevice,
      browser,
      ip_address: currentIp,
      geo_latitude: currentLat,
      geo_longitude: currentLon,
      network_latency: gaussianNoise(50, 20),
      network_type: pick(["wifi", "4g", "ethernet"]),
      session_start_time: sessionStart.toISOString(),
      session_login_attempts: randInt(
        profile.loginAttemptRange[0],
        profile.loginAttemptRange[1],
      ),
      session_inactivity_time: randInt(
        profile.inactivityRange[0],
        profile.inactivityRange[1],
      ),
      result: isError ? "error" : "success",
    });
  }

  return logs;
}

// --- Main generator ---

interface DatasetSample {
  features: number[];
  label: number;
}

export function generateDataset(totalSamples: number = 10000): {
  samples: DatasetSample[];
  featureStats: FeatureStats[];
} {
  const normalRatio = 0.5;
  const normalCount = Math.floor(totalSamples * normalRatio);
  const suspiciousCount = totalSamples - normalCount;

  console.log(
    `Generating ${totalSamples} samples (${normalCount} normal, ${suspiciousCount} suspicious)...`,
  );

  const allLogs: RawLogRow[] = [];
  const logLabels = new Map<string, number>();

  let normalGenerated = 0;
  let suspiciousGenerated = 0;
  let profileId = 0;

  // Generate normal profiles
  while (normalGenerated < normalCount) {
    profileId++;
    const profile =
      Math.random() < 0.6
        ? createNormalWorker(profileId)
        : createNormalManager(profileId);
    const logs = generateSessionLogs(profile);
    for (const log of logs) {
      logLabels.set(log.id, profile.label);
      allLogs.push(log);
      normalGenerated++;
      if (normalGenerated >= normalCount) break;
    }
  }

  // Generate suspicious profiles
  const suspiciousCreators = [
    createDataExfiltration,
    createPrivilegeEscalation,
    createAccountCompromise,
    createInsiderThreat,
  ];

  while (suspiciousGenerated < suspiciousCount) {
    profileId++;
    const creator = pick(suspiciousCreators);
    const profile = creator(profileId);
    const logs = generateSessionLogs(profile);
    for (const log of logs) {
      logLabels.set(log.id, profile.label);
      allLogs.push(log);
      suspiciousGenerated++;
      if (suspiciousGenerated >= suspiciousCount) break;
    }
  }

  console.log(`Generated ${allLogs.length} total log entries.`);

  // Build user histories and extract features
  const userHistories = buildUserHistories(allLogs);

  // Sort by timestamp for windowed features
  allLogs.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const WINDOW_SIZE = 50;
  const samples: DatasetSample[] = [];

  for (let i = 0; i < allLogs.length; i++) {
    const log = allLogs[i];
    const windowStart = Math.max(0, i - WINDOW_SIZE);
    const recentLogs = allLogs.slice(windowStart, i);

    const features = extractFeatures(
      log,
      recentLogs,
      userHistories.get(log.user_id),
    );
    const label = logLabels.get(log.id) ?? 0;
    samples.push({ features, label });
  }

  // Compute normalization stats
  const featureMatrix = samples.map((s) => s.features);
  const featureStats = computeFeatureStats(featureMatrix);

  // Normalize
  const normalized = normalizeFeatures(featureMatrix, featureStats);
  for (let i = 0; i < samples.length; i++) {
    samples[i].features = normalized[i];
  }

  // Shuffle
  for (let i = samples.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [samples[i], samples[j]] = [samples[j], samples[i]];
  }

  // Trim to exact totalSamples
  const finalSamples = samples.slice(0, totalSamples);

  const normalFinal = finalSamples.filter((s) => s.label === 0).length;
  const suspFinal = finalSamples.filter((s) => s.label === 1).length;
  console.log(
    `Final dataset: ${finalSamples.length} samples (${normalFinal} normal, ${suspFinal} suspicious)`,
  );
  console.log(`Features per sample: ${NUM_FEATURES}`);

  return { samples: finalSamples, featureStats };
}

// --- CLI entry point ---

async function main() {
  console.log("=== RAA Synthetic Dataset Generator ===\n");

  const totalSamples = parseInt(process.argv[2] || "10000", 10);
  const { samples, featureStats } = generateDataset(totalSamples);

  // Save dataset
  const outputDir = path.join(__dirname, "..", "..", "data", "synthetic");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const datasetPath = path.join(outputDir, "dataset.json");
  fs.writeFileSync(
    datasetPath,
    JSON.stringify(
      { samples, featureStats, featureNames: FEATURE_NAMES },
      null,
      2,
    ),
  );
  console.log(`\nDataset saved to ${datasetPath}`);

  // Save feature stats to database
  await initializeDatabase();
  const db = await getDb();

  db.run("DELETE FROM feature_stats");
  for (const stat of featureStats) {
    db.run(
      "INSERT INTO feature_stats (feature_name, min_val, max_val, mean_val, std_val) VALUES (?, ?, ?, ?, ?)",
      [stat.featureName, stat.min, stat.max, stat.mean, stat.std],
    );
  }
  saveDb();

  console.log("Feature stats saved to database.");

  // Print distribution summary
  console.log("\n--- Feature Stats Summary ---");
  for (const stat of featureStats) {
    console.log(
      `  ${stat.featureName}: min=${stat.min.toFixed(3)}, max=${stat.max.toFixed(3)}, mean=${stat.mean.toFixed(3)}, std=${stat.std.toFixed(3)}`,
    );
  }
}

main().catch(console.error);
