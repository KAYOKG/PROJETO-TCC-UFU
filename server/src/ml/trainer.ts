/**
 * TensorFlow.js Model Trainer
 *
 * Treina um classificador binário (normal vs. suspeito) usando rede neural densa.
 * Salva o modelo treinado e métricas para servir via API.
 */

import * as tf from "@tensorflow/tfjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb, saveDb } from "../db/connection.js";
import { initializeDatabase } from "../db/schema.js";
import { evaluateModel, evaluateRulesBaseline } from "./evaluator.js";
import {
  FEATURE_NAMES,
  NUM_FEATURES,
  type FeatureStats,
} from "./featureEngineering.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface DatasetSample {
  features: number[];
  label: number;
}

interface Dataset {
  samples: DatasetSample[];
  featureStats: FeatureStats[];
  featureNames: string[];
}

function loadDataset(): Dataset {
  const datasetPath = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "synthetic",
    "dataset.json",
  );
  if (!fs.existsSync(datasetPath)) {
    throw new Error("Dataset not found. Run `npm run generate-dataset` first.");
  }
  return JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
}

function splitDataset(
  samples: DatasetSample[],
  trainRatio = 0.7,
  valRatio = 0.15,
) {
  const trainEnd = Math.floor(samples.length * trainRatio);
  const valEnd = Math.floor(samples.length * (trainRatio + valRatio));

  return {
    train: samples.slice(0, trainEnd),
    val: samples.slice(trainEnd, valEnd),
    test: samples.slice(valEnd),
  };
}

function samplesToTensors(samples: DatasetSample[]) {
  const features = samples.map((s) => s.features);
  const labels = samples.map((s) => s.label);
  return {
    xs: tf.tensor2d(features, [features.length, NUM_FEATURES]),
    ys: tf.tensor2d(
      labels.map((l) => [l]),
      [labels.length, 1],
    ),
  };
}

function buildModel(): tf.Sequential {
  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      inputShape: [NUM_FEATURES],
      units: 64,
      activation: "relu",
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    }),
  );
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.3 }));

  model.add(
    tf.layers.dense({
      units: 32,
      activation: "relu",
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    }),
  );
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.dense({ units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
}

async function saveModel(model: tf.Sequential, outputDir: string) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Manual save: serialize topology + weights since pure tfjs lacks file:// handler
  const topology = model.toJSON(null, false);

  const weightData: Array<{
    name: string;
    shape: number[];
    dtype: string;
    data: number[];
  }> = [];
  const weights = model.getWeights();
  for (let wi = 0; wi < weights.length; wi++) {
    const w = weights[wi];
    weightData.push({
      name: (w as unknown as { name: string }).name || `weight_${wi}`,
      shape: w.shape,
      dtype: w.dtype,
      data: Array.from(w.dataSync()),
    });
  }

  const modelJson = {
    format: "layers-model",
    generatedBy: "raa-trainer",
    modelTopology:
      typeof topology === "string" ? JSON.parse(topology) : topology,
    weightsManifest: [
      {
        paths: ["weights.bin"],
        weights: weightData.map((w) => ({
          name: w.name,
          shape: w.shape,
          dtype: w.dtype,
        })),
      },
    ],
  };

  fs.writeFileSync(
    path.join(outputDir, "model.json"),
    JSON.stringify(modelJson, null, 2),
  );

  // Save weights as binary
  const totalSize = weightData.reduce((sum, w) => sum + w.data.length * 4, 0);
  const buffer = new ArrayBuffer(totalSize);
  const view = new Float32Array(buffer);
  let offset = 0;
  for (const w of weightData) {
    for (const val of w.data) {
      view[offset++] = val;
    }
  }
  fs.writeFileSync(path.join(outputDir, "weights.bin"), Buffer.from(buffer));

  console.log(`Model saved to ${outputDir}`);
}

const EPOCHS = 50;
const BATCH_SIZE = 64;

export interface RunTrainingResult {
  mlMetrics: ReturnType<typeof import("./evaluator.js").evaluateModel>;
  rulesMetrics: ReturnType<typeof evaluateRulesBaseline>;
  modelVersion: string;
  datasetSize: number;
  trainingTimeMs: number;
}

export async function runTraining(options?: {
  extraSamples?: DatasetSample[];
}): Promise<RunTrainingResult> {
  const startTime = Date.now();
  const dataset = loadDataset();
  let samples = dataset.samples;

  if (options?.extraSamples?.length) {
    samples = [...dataset.samples, ...options.extraSamples];
  }

  console.log(
    `Loaded ${samples.length} samples (synthetic: ${dataset.samples.length}, extra: ${options?.extraSamples?.length ?? 0})`,
  );

  const { train, val, test } = splitDataset(samples);
  console.log(
    `Split: ${train.length} train, ${val.length} val, ${test.length} test`,
  );

  const trainData = samplesToTensors(train);
  const valData = samplesToTensors(val);
  const testData = samplesToTensors(test);

  const model = buildModel();
  model.summary();

  console.log(
    `\nTraining for ${EPOCHS} epochs (batch size ${BATCH_SIZE})...\n`,
  );

  const history = await model.fit(trainData.xs, trainData.ys, {
    epochs: EPOCHS,
    batchSize: BATCH_SIZE,
    validationData: [valData.xs, valData.ys],
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 5 === 0) {
          console.log(
            `Epoch ${epoch + 1}/${EPOCHS} - loss: ${logs?.loss?.toFixed(4)} - acc: ${logs?.acc?.toFixed(4)} - val_loss: ${logs?.val_loss?.toFixed(4)} - val_acc: ${logs?.val_acc?.toFixed(4)}`,
          );
        }
      },
    },
  });

  const trainingTimeMs = Date.now() - startTime;

  // Evaluate on test set
  console.log("\n--- Test Set Evaluation (ML Model) ---");
  const testPredictions = (model.predict(testData.xs) as tf.Tensor).dataSync();
  const testLabels = test.map((s) => s.label);
  const testPreds = Array.from(testPredictions);

  const mlMetrics = evaluateModel(testLabels, testPreds, 0.5);
  console.log(`Accuracy:  ${mlMetrics.accuracy.toFixed(4)}`);
  console.log(`Precision: ${mlMetrics.precision.toFixed(4)}`);
  console.log(`Recall:    ${mlMetrics.recall.toFixed(4)}`);
  console.log(`F1-Score:  ${mlMetrics.f1Score.toFixed(4)}`);
  console.log(`AUC-ROC:   ${mlMetrics.aucRoc.toFixed(4)}`);

  // Evaluate rules baseline
  console.log("\n--- Test Set Evaluation (Rules Baseline) ---");
  const rulesMetrics = evaluateRulesBaseline(test, dataset.featureStats);
  console.log(`Accuracy:  ${rulesMetrics.accuracy.toFixed(4)}`);
  console.log(`Precision: ${rulesMetrics.precision.toFixed(4)}`);
  console.log(`Recall:    ${rulesMetrics.recall.toFixed(4)}`);
  console.log(`F1-Score:  ${rulesMetrics.f1Score.toFixed(4)}`);

  // Comparison
  console.log("\n--- ML vs. Rules Comparison ---");
  console.log(`ML F1:    ${mlMetrics.f1Score.toFixed(4)}`);
  console.log(`Rules F1: ${rulesMetrics.f1Score.toFixed(4)}`);
  const improvement =
    ((mlMetrics.f1Score - rulesMetrics.f1Score) /
      Math.max(rulesMetrics.f1Score, 0.001)) *
    100;
  console.log(`Improvement: ${improvement.toFixed(1)}%`);

  // Save model
  const modelDir = path.join(__dirname, "..", "..", "data", "trained");
  await saveModel(model, modelDir);

  // Save feature stats alongside model
  const statsPath = path.join(modelDir, "feature_stats.json");
  fs.writeFileSync(statsPath, JSON.stringify(dataset.featureStats, null, 2));

  // Save learning curve (per-epoch loss/accuracy for overfitting analysis)
  const learningCurve = {
    epochs: Array.from({ length: EPOCHS }, (_, i) => i + 1),
    trainLoss: history.history.loss as number[],
    valLoss: history.history.val_loss as number[],
    trainAcc: history.history.acc as number[],
    valAcc: history.history.val_acc as number[],
  };
  fs.writeFileSync(
    path.join(modelDir, "learning_curve.json"),
    JSON.stringify(learningCurve, null, 2),
  );

  // Save confusion matrices for visual display
  const confusionData = {
    ml: mlMetrics.confusionMatrix,
    rules: rulesMetrics.confusionMatrix,
    testSize: test.length,
  };
  fs.writeFileSync(
    path.join(modelDir, "confusion_matrix.json"),
    JSON.stringify(confusionData, null, 2),
  );

  // Print confusion matrices to console
  const mlCm = mlMetrics.confusionMatrix;
  console.log("\n--- Confusion Matrix (ML) ---");
  console.log(`              Pred Normal  Pred Suspeito`);
  console.log(
    `Real Normal      ${String(mlCm.tn).padStart(5)}          ${String(mlCm.fp).padStart(5)}`,
  );
  console.log(
    `Real Suspeito    ${String(mlCm.fn).padStart(5)}          ${String(mlCm.tp).padStart(5)}`,
  );

  const rCm = rulesMetrics.confusionMatrix;
  console.log("\n--- Confusion Matrix (Rules) ---");
  console.log(`              Pred Normal  Pred Suspeito`);
  console.log(
    `Real Normal      ${String(rCm.tn).padStart(5)}          ${String(rCm.fp).padStart(5)}`,
  );
  console.log(
    `Real Suspeito    ${String(rCm.fn).padStart(5)}          ${String(rCm.tp).padStart(5)}`,
  );

  // Save metrics to database
  const modelVersion = `v1.0-${Date.now()}`;
  await initializeDatabase();
  const db = await getDb();

  const finalHistory = history.history;
  const lastEpochLoss = (finalHistory.loss as number[])?.[EPOCHS - 1] ?? 0;
  const lastEpochValLoss =
    (finalHistory.val_loss as number[])?.[EPOCHS - 1] ?? 0;
  const lastEpochValAcc = (finalHistory.val_acc as number[])?.[EPOCHS - 1] ?? 0;

  db.run(
    `INSERT INTO training_metrics (
      model_version, accuracy, precision_score, recall_score, f1_score, auc_roc,
      loss, val_accuracy, val_loss, epochs, dataset_size, training_time_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      modelVersion,
      mlMetrics.accuracy,
      mlMetrics.precision,
      mlMetrics.recall,
      mlMetrics.f1Score,
      mlMetrics.aucRoc,
      lastEpochLoss,
      lastEpochValAcc,
      lastEpochValLoss,
      EPOCHS,
      dataset.samples.length,
      trainingTimeMs,
    ],
  );

  // Save rules baseline metrics too
  db.run(
    `INSERT INTO training_metrics (
      model_version, accuracy, precision_score, recall_score, f1_score, auc_roc,
      loss, val_accuracy, val_loss, epochs, dataset_size, training_time_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `rules-baseline-${Date.now()}`,
      rulesMetrics.accuracy,
      rulesMetrics.precision,
      rulesMetrics.recall,
      rulesMetrics.f1Score,
      0,
      0,
      0,
      0,
      0,
      dataset.samples.length,
      0,
    ],
  );

  saveDb();

  // Cleanup tensors
  trainData.xs.dispose();
  trainData.ys.dispose();
  valData.xs.dispose();
  valData.ys.dispose();
  testData.xs.dispose();
  testData.ys.dispose();

  return {
    mlMetrics,
    rulesMetrics,
    modelVersion,
    datasetSize: samples.length,
    trainingTimeMs,
  };
}

async function main() {
  console.log("=== RAA TensorFlow.js Trainer ===\n");
  const result = await runTraining();
  console.log(`\nMetrics saved to database (version: ${result.modelVersion})`);
  console.log(
    `Training completed in ${(result.trainingTimeMs / 1000).toFixed(1)}s`,
  );
  console.log("\n--- NOTA: Limitação do Dataset Sintético ---");
  console.log(
    "Os perfis de comportamento do dataset sintético possuem padrões bem definidos",
  );
  console.log(
    "e separáveis por design. Em cenários reais, comportamentos legítimos e maliciosos",
  );
  console.log(
    "tendem a se sobrepor de forma mais sutil, resultando em métricas inferiores.",
  );
}

main().catch(console.error);
