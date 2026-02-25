/**
 * Model Loader - Frontend
 *
 * Carrega o modelo TF.js treinado e as estatísticas de features do backend.
 */

import * as tf from '@tensorflow/tfjs';
import { FeatureStats, NUM_FEATURES, FEATURE_NAMES } from '../types';
import { getModelUrl, fetchFeatureStats } from '../services/api';

let model: tf.LayersModel | null = null;
let featureStats: FeatureStats[] | null = null;
let loading = false;

export async function loadModel(): Promise<tf.LayersModel> {
  if (model) return model;
  if (loading) {
    // Wait for existing load to complete
    while (loading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (model) return model;
  }

  loading = true;
  try {
    const modelUrl = getModelUrl();
    model = await tf.loadLayersModel(modelUrl);
    console.log('ML model loaded successfully');
    return model;
  } catch (error) {
    console.warn('Failed to load ML model:', error);
    throw error;
  } finally {
    loading = false;
  }
}

export async function getFeatureStats(): Promise<FeatureStats[]> {
  if (featureStats) return featureStats;

  try {
    const response = await fetchFeatureStats();
    if (response.stats && response.stats.length > 0) {
      featureStats = response.stats.map((s: Record<string, unknown>) => ({
        featureName: s.feature_name as string,
        min: s.min_val as number,
        max: s.max_val as number,
        mean: s.mean_val as number,
        std: s.std_val as number,
      }));
      return featureStats!;
    }
  } catch (error) {
    console.warn('Failed to load feature stats from API:', error);
  }

  // Fallback: default stats (no normalization)
  return FEATURE_NAMES.map(name => ({
    featureName: name,
    min: 0,
    max: 1,
    mean: 0.5,
    std: 0.25,
  }));
}

export function isModelLoaded(): boolean {
  return model !== null;
}

export function getLoadedModel(): tf.LayersModel | null {
  return model;
}

export { NUM_FEATURES };
