import { create } from 'zustand';
import { MLPrediction, RiskAlert, TrainingMetrics, SystemLog } from '../types';
import { classifyLog, applyStaticRules } from '../ml/inferenceEngine';
import { isModelLoaded, loadModel } from '../ml/modelLoader';
import { fetchAlertsSummary, fetchTrainingMetrics } from '../services/api';

interface MLState {
  predictions: MLPrediction[];
  alerts: RiskAlert[];
  trainingMetrics: TrainingMetrics[];
  modelLoaded: boolean;
  modelLoading: boolean;
  threshold: number;
  userRiskScores: Map<string, number>;
  alertsSummary: {
    userRisks: Record<string, unknown>[];
    alertsByType: Record<string, unknown>[];
    recentAlerts: Record<string, unknown>[];
    mlVsRules: Record<string, unknown>[];
  } | null;

  initializeModel: () => Promise<void>;
  analyzeLog: (log: SystemLog, recentLogs: SystemLog[]) => Promise<void>;
  setThreshold: (threshold: number) => void;
  loadDashboardData: () => Promise<void>;
}

export const useMLStore = create<MLState>((set, get) => ({
  predictions: [],
  alerts: [],
  trainingMetrics: [],
  modelLoaded: false,
  modelLoading: false,
  threshold: 0.7,
  userRiskScores: new Map(),
  alertsSummary: null,

  initializeModel: async () => {
    if (get().modelLoaded || get().modelLoading) return;

    set({ modelLoading: true });
    try {
      await loadModel();
      set({ modelLoaded: true, modelLoading: false });
    } catch {
      set({ modelLoading: false });
    }
  },

  analyzeLog: async (log: SystemLog, recentLogs: SystemLog[]) => {
    const { threshold } = get();

    // ML prediction
    let mlPrediction: MLPrediction | null = null;
    if (isModelLoaded()) {
      mlPrediction = await classifyLog(log, recentLogs, threshold);
    }

    // Rules baseline
    const rulesResult = applyStaticRules(log, recentLogs);

    if (mlPrediction) {
      set(state => {
        const predictions = [mlPrediction, ...state.predictions].slice(0, 500);

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
            alertType: mlPrediction.alertType ?? 'Anomalous Behavior',
            description: `ML detectou comportamento suspeito: ${log.action} (score: ${mlPrediction.riskScore.toFixed(3)})`,
            isMlDetection: true,
            createdAt: new Date().toISOString(),
          });
        }

        if (rulesResult.isSuspicious) {
          newAlerts.unshift({
            id: Date.now() + 1,
            logId: log.id,
            userId: log.userId,
            userName: log.userName,
            riskScore: rulesResult.score,
            alertType: 'Rule Violation',
            description: `Regras: ${rulesResult.rules.join('; ')}`,
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
