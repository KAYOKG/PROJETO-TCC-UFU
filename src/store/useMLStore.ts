import { create } from "zustand";
import { applyStaticRules, classifyLog } from "../ml/inferenceEngine";
import { isModelLoaded, loadModel } from "../ml/modelLoader";
import {
  createIncident,
  fetchAlertsSummary,
  fetchTrainingMetrics,
  reportPrediction,
} from "../services/api";
import { MLPrediction, RiskAlert, SystemLog, TrainingMetrics } from "../types";
import { useApiErrorStore } from "./useApiErrorStore";
import { useAuthStore } from "./useAuthStore";
import { useBlockStore } from "./useBlockStore";

interface MLState {
  predictions: MLPrediction[];
  alerts: RiskAlert[];
  trainingMetrics: TrainingMetrics[];
  modelLoaded: boolean;
  modelLoading: boolean;
  modelError: string | null;
  threshold: number;
  userRiskScores: Map<string, number>;
  /** Evita race: só uma análise por userId por vez */
  isAnalyzingByUser: Map<string, boolean>;
  /** Fila de logs pendentes por userId (para simulação e picos de atividade) */
  analysisQueue: Map<
    string,
    Array<{ log: SystemLog; recentLogs: SystemLog[] }>
  >;
  alertsSummary: {
    userRisks: Record<string, unknown>[];
    alertsByType: Record<string, unknown>[];
    recentAlerts: Record<string, unknown>[];
    mlVsRules: Record<string, unknown>[];
  } | null;

  initializeModel: () => Promise<void>;
  retryModelLoad: () => Promise<void>;
  analyzeLog: (log: SystemLog, recentLogs: SystemLog[]) => Promise<void>;
  setThreshold: (threshold: number) => void;
  loadDashboardData: () => Promise<void>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export const useMLStore = create<MLState>((set, get) => ({
  predictions: [],
  alerts: [],
  trainingMetrics: [],
  modelLoaded: false,
  modelLoading: false,
  modelError: null,
  threshold: 0.7,
  userRiskScores: new Map(),
  isAnalyzingByUser: new Map(),
  analysisQueue: new Map(),
  alertsSummary: null,

  initializeModel: async () => {
    if (get().modelLoaded || get().modelLoading) return;

    set({ modelLoading: true, modelError: null });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await loadModel();
        set({ modelLoaded: true, modelLoading: false, modelError: null });
        return;
      } catch (err) {
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        } else {
          const msg =
            err instanceof Error ? err.message : "Falha ao carregar modelo";
          if (import.meta.env.DEV)
            console.warn(
              `Model load failed after ${MAX_RETRIES} attempts:`,
              msg,
            );
          set({ modelLoading: false, modelError: msg });
        }
      }
    }
  },

  retryModelLoad: async () => {
    set({ modelLoaded: false, modelLoading: false, modelError: null });
    await get().initializeModel();
    if (get().modelLoaded) {
      await get().loadDashboardData();
    }
  },

  analyzeLog: async (log: SystemLog, recentLogs: SystemLog[]) => {
    // SuperAdmin é o observador, nunca o observado
    if (String(log.userId).toLowerCase() === "superadmin") return;
    // Usuário sistema não é analisado pelo ML
    if (
      String(log.userId).toLowerCase() === "system" ||
      String(log.userName).toLowerCase() === "sistema"
    )
      return;
    // Cliques de UI são apenas registrados; não passam pela inferência ML (evita incidentes falsos)
    if (
      log.interactionType === "click" ||
      (log.action &&
        String(log.action).includes("Interação do Usuário - click"))
    )
      return;

    // Mutex por userId: uma análise por vez; demais entram na fila para não perder predições (gráficos/simulação)
    const userId = log.userId;
    if (get().isAnalyzingByUser.get(userId)) {
      set((state) => {
        const queue = state.analysisQueue.get(userId) ?? [];
        return {
          analysisQueue: new Map(state.analysisQueue).set(userId, [
            ...queue,
            { log, recentLogs },
          ]),
        };
      });
      return;
    }
    set((state) => ({
      isAnalyzingByUser: new Map(state.isAnalyzingByUser).set(userId, true),
    }));

    try {
      const { threshold } = get();

      // ML prediction
      let mlPrediction: MLPrediction | null = null;
      if (isModelLoaded()) {
        mlPrediction = await classifyLog(log, recentLogs, threshold);
      }

      // Rules baseline
      const rulesResult = applyStaticRules(log, recentLogs);

      if (mlPrediction) {
        reportPrediction({
          userId: log.userId,
          riskScore: mlPrediction.riskScore,
          logId: log.id,
        }).catch(() => {});

        set((state) => {
          const predictions = [mlPrediction, ...state.predictions].slice(
            0,
            500,
          );

          const userRiskScores = new Map(state.userRiskScores);
          const currentScore = userRiskScores.get(log.userId) ?? 0;
          const newScore = currentScore * 0.8 + mlPrediction.riskScore * 0.2;
          userRiskScores.set(log.userId, newScore);

          const newAlerts = [...state.alerts];

          if (mlPrediction.isSuspicious) {
            newAlerts.unshift({
              id: Date.now(),
              logId: log.id,
              userId: log.userId,
              userName: log.userName,
              riskScore: mlPrediction.riskScore,
              alertType: mlPrediction.alertType ?? "Anomalous Behavior",
              description: `ML detectou comportamento suspeito: ${log.action} (score: ${mlPrediction.riskScore.toFixed(3)})`,
              isMlDetection: true,
              createdAt: new Date().toISOString(),
            });
            createIncident({
              logId: log.id,
              userId: log.userId,
              userName: log.userName,
              action: log.action,
              details: log.details ?? "",
              riskScore: mlPrediction.riskScore,
              mlPrediction: mlPrediction.riskScore,
              featureVector: mlPrediction.featureVector,
            })
              .then((body) => {
                useApiErrorStore.getState().resetApiErrorCount();
                if (useAuthStore.getState().user?.role === "superadmin") return;
                useBlockStore.getState().setBlocked({
                  blockedUntil:
                    body.blocked_until ??
                    new Date(Date.now() + 3 * 60 * 1000).toISOString(),
                  reason:
                    body.reason ??
                    "Atividade incomum detectada. Aguarde revisão.",
                  status: "timeout",
                });
              })
              .catch(() => useApiErrorStore.getState().incrementApiError());
          }

          if (rulesResult.isSuspicious) {
            newAlerts.unshift({
              id: Date.now() + 1,
              logId: log.id,
              userId: log.userId,
              userName: log.userName,
              riskScore: rulesResult.score,
              alertType: "Rule Violation",
              description: `Regras: ${rulesResult.rules.join("; ")}`,
              isMlDetection: false,
              createdAt: new Date().toISOString(),
            });
          }

          return {
            predictions,
            alerts: newAlerts.slice(0, 200),
            userRiskScores,
          };
        });
      }
    } finally {
      const state = get();
      const queue = state.analysisQueue.get(userId) ?? [];
      const nextItem = queue[0];
      set((s) => {
        const nextMap = new Map(s.isAnalyzingByUser);
        nextMap.delete(userId);
        const q = s.analysisQueue.get(userId) ?? [];
        const newQueue = new Map(s.analysisQueue);
        if (q.length > 1) newQueue.set(userId, q.slice(1));
        else newQueue.delete(userId);
        return { isAnalyzingByUser: nextMap, analysisQueue: newQueue };
      });
      if (nextItem) {
        setTimeout(
          () => get().analyzeLog(nextItem.log, nextItem.recentLogs),
          0,
        );
      }
    }
  },

  setThreshold: (threshold: number) => set({ threshold }),

  loadDashboardData: async () => {
    try {
      const [summaryRes, metricsRes] = await Promise.all([
        fetchAlertsSummary(),
        fetchTrainingMetrics(),
      ]);

      set({
        alertsSummary: summaryRes,
        trainingMetrics: metricsRes.metrics ?? [],
      });
    } catch {
      // Silently handle - dashboard works with local data too
    }
  },
}));
