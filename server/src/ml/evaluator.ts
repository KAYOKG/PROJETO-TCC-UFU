/**
 * Model Evaluator
 *
 * Calcula métricas de avaliação e implementa o baseline de regras estáticas.
 */

import { FEATURE_NAMES, type FeatureStats } from './featureEngineering.js';

export interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc: number;
  confusionMatrix: { tp: number; fp: number; tn: number; fn: number };
}

function confusionMatrix(labels: number[], predictions: number[], threshold: number) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < labels.length; i++) {
    const pred = predictions[i] >= threshold ? 1 : 0;
    const actual = labels[i];
    if (pred === 1 && actual === 1) tp++;
    else if (pred === 1 && actual === 0) fp++;
    else if (pred === 0 && actual === 0) tn++;
    else fn++;
  }
  return { tp, fp, tn, fn };
}

/**
 * AUC-ROC via trapezoidal approximation
 */
function computeAucRoc(labels: number[], scores: number[]): number {
  const pairs = labels.map((label, i) => ({ label, score: scores[i] }));
  pairs.sort((a, b) => b.score - a.score);

  const totalPos = labels.filter(l => l === 1).length;
  const totalNeg = labels.length - totalPos;
  if (totalPos === 0 || totalNeg === 0) return 0.5;

  let auc = 0;
  let tpCount = 0;
  let fpCount = 0;
  let prevTpr = 0;
  let prevFpr = 0;

  for (const pair of pairs) {
    if (pair.label === 1) tpCount++;
    else fpCount++;

    const tpr = tpCount / totalPos;
    const fpr = fpCount / totalNeg;

    auc += (fpr - prevFpr) * (tpr + prevTpr) / 2;
    prevTpr = tpr;
    prevFpr = fpr;
  }

  return auc;
}

export function evaluateModel(
  labels: number[],
  predictions: number[],
  threshold: number = 0.5,
): EvaluationMetrics {
  const cm = confusionMatrix(labels, predictions, threshold);
  const accuracy = (cm.tp + cm.tn) / (cm.tp + cm.fp + cm.tn + cm.fn);
  const precision = cm.tp + cm.fp > 0 ? cm.tp / (cm.tp + cm.fp) : 0;
  const recall = cm.tp + cm.fn > 0 ? cm.tp / (cm.tp + cm.fn) : 0;
  const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  const aucRoc = computeAucRoc(labels, predictions);

  return { accuracy, precision, recall, f1Score, aucRoc, confusionMatrix: cm };
}

// --- Rules Baseline ---
// Regras estáticas simples para comparação com ML

interface DatasetSample {
  features: number[];
  label: number;
}

function denormalize(value: number, stat: FeatureStats): number {
  const range = stat.max - stat.min;
  return value * range + stat.min;
}

export function applyRulesBaseline(
  features: number[],
  featureStats: FeatureStats[],
): number {
  const featureMap = new Map<string, number>();
  FEATURE_NAMES.forEach((name, i) => {
    featureMap.set(name, denormalize(features[i], featureStats[i]));
  });

  let score = 0;
  let ruleCount = 0;

  // Rule 1: High action frequency (>50 actions in window)
  const actionFreq = featureMap.get('actionFrequency') ?? 0;
  if (actionFreq > 50) { score += 1; }
  ruleCount++;

  // Rule 2: Access outside business hours (22h-6h)
  const hour = featureMap.get('hourOfDay') ?? 12;
  if (hour >= 22 || hour < 6) { score += 1; }
  ruleCount++;

  // Rule 3: Multiple login attempts (>3)
  const loginAttempts = featureMap.get('loginAttempts') ?? 1;
  if (loginAttempts > 3) { score += 1; }
  ruleCount++;

  // Rule 4: IP changed from usual
  const ipChange = featureMap.get('ipChangeFlag') ?? 0;
  if (ipChange > 0.5) { score += 1; }
  ruleCount++;

  // Rule 5: High error rate (>20%)
  const errorRate = featureMap.get('errorRate') ?? 0;
  if (errorRate > 0.2) { score += 1; }
  ruleCount++;

  // Rule 6: Burst activity (>5 actions in 1 min)
  const burstScore = featureMap.get('burstScore') ?? 0;
  if (burstScore > 5) { score += 1; }
  ruleCount++;

  // Rule 7: High sensitive data access
  const sensitiveAccess = featureMap.get('sensitiveDataAccessCount') ?? 0;
  if (sensitiveAccess > 20) { score += 1; }
  ruleCount++;

  // Rule 8: Geo distance from usual location
  const geoDist = featureMap.get('geoDistanceFromUsual') ?? 0;
  if (geoDist > 100) { score += 1; }
  ruleCount++;

  // Suspicious if 2+ rules triggered
  return score >= 2 ? 1 : 0;
}

export function evaluateRulesBaseline(
  testSamples: DatasetSample[],
  featureStats: FeatureStats[],
): EvaluationMetrics {
  const labels = testSamples.map(s => s.label);
  const predictions = testSamples.map(s =>
    applyRulesBaseline(s.features, featureStats)
  );

  return evaluateModel(labels, predictions, 0.5);
}
