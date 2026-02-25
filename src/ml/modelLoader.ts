/**
 * Model Loader - Frontend
 *
 * Carrega o modelo TF.js treinado e as estatísticas de features do backend.
 */

import * as tf from "@tensorflow/tfjs";
import { fetchFeatureStats, getModelUrl } from "../services/api";
import { FEATURE_NAMES, FeatureStats, NUM_FEATURES } from "../types";

let model: tf.LayersModel | null = null;
let featureStats: FeatureStats[] | null = null;
let loading = false;

export async function loadModel(): Promise<tf.LayersModel> {
  if (model) return model;
  if (loading) {
    // Wait for existing load to complete
    while (loading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (model) return model;
  }

  loading = true;
  try {
    const modelUrl = getModelUrl();
    model = await tf.loadLayersModel(modelUrl);
    if (import.meta.env.DEV) console.log("ML model loaded successfully");
    return model;
  } catch (error) {
    if (import.meta.env.DEV) console.warn("Failed to load ML model:", error);
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
      const statsMap = new Map<string, FeatureStats>();
      for (const s of response.stats) {
        statsMap.set(s.feature_name as string, {
          featureName: s.feature_name as string,
          min: s.min_val as number,
          max: s.max_val as number,
          mean: s.mean_val as number,
          std: s.std_val as number,
        });
      }

      // Reorder to match FEATURE_NAMES (API returns alphabetical order)
      featureStats = FEATURE_NAMES.map((name) => {
        const stat = statsMap.get(name);
        if (stat) return stat;
        return { featureName: name, min: 0, max: 1, mean: 0.5, std: 0.25 };
      });
      return featureStats;
    }
  } catch (error) {
    if (import.meta.env.DEV)
      console.warn("Failed to load feature stats from API:", error);
  }

  return FEATURE_NAMES.map((name) => ({
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
