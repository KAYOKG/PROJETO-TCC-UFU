/**
 * Inference Engine - Frontend
 *
 * Executa classificação em tempo real usando o modelo carregado.
 */

import * as tf from '@tensorflow/tfjs';
import { SystemLog, MLPrediction, NUM_FEATURES } from '../types';
import { loadModel, getFeatureStats } from './modelLoader';
import { extractFeaturesFromLog, featureVectorToArray, normalizeVector } from './featureEngineering';

const DEFAULT_THRESHOLD = 0.7;

export async function classifyLog(
  log: SystemLog,
  recentLogs: SystemLog[],
  threshold: number = DEFAULT_THRESHOLD,
): Promise<MLPrediction | null> {
  try {
    const mdl = await loadModel();
    const stats = await getFeatureStats();

    const featureVector = extractFeaturesFromLog(log, recentLogs);
    const rawArray = featureVectorToArray(featureVector);
    const normalized = normalizeVector(rawArray, stats);

    const inputTensor = tf.tensor2d([normalized], [1, NUM_FEATURES]);
    const prediction = mdl.predict(inputTensor) as tf.Tensor;
    const riskScore = (await prediction.data())[0];

    inputTensor.dispose();
    prediction.dispose();

    const isSuspicious = riskScore >= threshold;

    let alertType: string | undefined;
    if (isSuspicious) {
      alertType = determineAlertType(featureVector);
    }

    return {
      logId: log.id,
      userId: log.userId,
      riskScore,
      isSuspicious,
      alertType,
      featureVector: normalized,
      timestamp: new Date(),
    };
  } catch {
    return null;
  }
}

function determineAlertType(features: Record<string, number>): string {
  if (features.burstScore > 5 && features.actionFrequency > 30) {
    return 'Data Exfiltration';
  }
  if (features.errorRate > 0.2 && features.loginAttempts > 3) {
    return 'Privilege Escalation';
  }
  if (features.ipChangeFlag > 0 || features.geoDistanceFromUsual > 50) {
    return 'Account Compromise';
  }
  if (features.sensitiveDataAccessCount > 15 && (features.hourOfDay >= 22 || features.hourOfDay < 6)) {
    return 'Insider Threat';
  }
  return 'Anomalous Behavior';
}

export function applyStaticRules(
  log: SystemLog,
  recentLogs: SystemLog[],
): { isSuspicious: boolean; score: number; rules: string[] } {
  const userLogs = recentLogs.filter(l => l.userId === log.userId);
  const triggeredRules: string[] = [];

  // Rule 1: High frequency
  if (userLogs.length > 50) {
    triggeredRules.push('Alta frequência de ações (>50 em janela)');
  }

  // Rule 2: Off-hours access
  const hour = (log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)).getHours();
  if (hour >= 22 || hour < 6) {
    triggeredRules.push('Acesso fora do horário comercial');
  }

  // Rule 3: Multiple login attempts
  if (log.session.loginAttempts > 3) {
    triggeredRules.push('Múltiplas tentativas de login (>3)');
  }

  // Rule 4: High error rate
  const errors = userLogs.filter(l => l.result === 'error').length;
  if (userLogs.length > 0 && errors / userLogs.length > 0.2) {
    triggeredRules.push('Alta taxa de erros (>20%)');
  }

  // Rule 5: Burst activity
  const now = (log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)).getTime();
  const oneMinAgo = now - 60000;
  const burstCount = userLogs.filter(l =>
    (l.timestamp instanceof Date ? l.timestamp : new Date(l.timestamp)).getTime() >= oneMinAgo
  ).length;
  if (burstCount > 10) {
    triggeredRules.push('Rajada de atividade (>10 ações/min)');
  }

  const score = Math.min(1, triggeredRules.length / 3);
  return {
    isSuspicious: triggeredRules.length >= 2,
    score,
    rules: triggeredRules,
  };
}
