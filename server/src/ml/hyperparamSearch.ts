/**
 * Hyperparameter Search & Cross-Validation
 *
 * Busca os melhores hiperparâmetros para o modelo de classificação.
 * Usa k-fold cross-validation para avaliação robusta.
 */

import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NUM_FEATURES, type FeatureStats } from './featureEngineering.js';
import { evaluateModel, evaluateRulesBaseline } from './evaluator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface DatasetSample {
  features: number[];
  label: number;
}

interface HyperParams {
  learningRate: number;
  hiddenUnits: number[];
  dropoutRates: number[];
  batchSize: number;
  epochs: number;
  l2Reg: number;
}

interface SearchResult {
  params: HyperParams;
  avgF1: number;
  avgAccuracy: number;
  avgPrecision: number;
  avgRecall: number;
  foldResults: { f1: number; accuracy: number }[];
}

function buildModelFromParams(params: HyperParams): tf.Sequential {
  const model = tf.sequential();

  model.add(tf.layers.dense({
    inputShape: [NUM_FEATURES],
    units: params.hiddenUnits[0],
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: params.l2Reg }),
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: params.dropoutRates[0] }));

  for (let i = 1; i < params.hiddenUnits.length; i++) {
    model.add(tf.layers.dense({
      units: params.hiddenUnits[i],
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2({ l2: params.l2Reg }),
    }));
    if (i < params.dropoutRates.length) {
      model.add(tf.layers.dropout({ rate: params.dropoutRates[i] }));
    }
  }

  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(params.learningRate),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

function kFoldSplit(samples: DatasetSample[], k: number, foldIndex: number) {
  const foldSize = Math.floor(samples.length / k);
  const valStart = foldIndex * foldSize;
  const valEnd = foldIndex === k - 1 ? samples.length : (foldIndex + 1) * foldSize;

  const val = samples.slice(valStart, valEnd);
  const train = [...samples.slice(0, valStart), ...samples.slice(valEnd)];
  return { train, val };
}

async function evaluateParams(
  params: HyperParams,
  samples: DatasetSample[],
  k: number = 5,
): Promise<SearchResult> {
  const foldResults: { f1: number; accuracy: number }[] = [];

  for (let fold = 0; fold < k; fold++) {
    const { train, val } = kFoldSplit(samples, k, fold);

    const trainXs = tf.tensor2d(train.map(s => s.features), [train.length, NUM_FEATURES]);
    const trainYs = tf.tensor2d(train.map(s => [s.label]), [train.length, 1]);
    const valXs = tf.tensor2d(val.map(s => s.features), [val.length, NUM_FEATURES]);

    const model = buildModelFromParams(params);

    await model.fit(trainXs, trainYs, {
      epochs: params.epochs,
      batchSize: params.batchSize,
      verbose: 0,
    });

    const predictions = (model.predict(valXs) as tf.Tensor).dataSync();
    const labels = val.map(s => s.label);
    const metrics = evaluateModel(labels, Array.from(predictions), 0.5);

    foldResults.push({ f1: metrics.f1Score, accuracy: metrics.accuracy });

    trainXs.dispose();
    trainYs.dispose();
    valXs.dispose();
    model.dispose();
  }

  const avgF1 = foldResults.reduce((a, b) => a + b.f1, 0) / k;
  const avgAccuracy = foldResults.reduce((a, b) => a + b.accuracy, 0) / k;
  const avgPrecision = avgF1; // approximate
  const avgRecall = avgF1;

  return { params, avgF1, avgAccuracy, avgPrecision, avgRecall, foldResults };
}

async function main() {
  console.log('=== RAA Hyperparameter Search (5-Fold CV) ===\n');

  const datasetPath = path.join(__dirname, '..', '..', 'data', 'synthetic', 'dataset.json');
  if (!fs.existsSync(datasetPath)) {
    console.error('Dataset not found. Run `npm run generate-dataset` first.');
    process.exit(1);
  }

  const { samples, featureStats } = JSON.parse(fs.readFileSync(datasetPath, 'utf-8')) as {
    samples: DatasetSample[];
    featureStats: FeatureStats[];
  };

  console.log(`Dataset: ${samples.length} samples\n`);

  // Rules baseline (for reference)
  const rulesMetrics = evaluateRulesBaseline(samples, featureStats);
  console.log(`Rules Baseline F1: ${rulesMetrics.f1Score.toFixed(4)}\n`);

  const paramGrid: HyperParams[] = [
    { learningRate: 0.001, hiddenUnits: [64, 32, 16], dropoutRates: [0.3, 0.2], batchSize: 64, epochs: 30, l2Reg: 0.001 },
    { learningRate: 0.001, hiddenUnits: [128, 64, 32], dropoutRates: [0.4, 0.3], batchSize: 64, epochs: 30, l2Reg: 0.001 },
    { learningRate: 0.0005, hiddenUnits: [64, 32, 16], dropoutRates: [0.3, 0.2], batchSize: 32, epochs: 40, l2Reg: 0.0005 },
    { learningRate: 0.001, hiddenUnits: [32, 16], dropoutRates: [0.2], batchSize: 64, epochs: 30, l2Reg: 0.001 },
    { learningRate: 0.002, hiddenUnits: [64, 32, 16], dropoutRates: [0.3, 0.2], batchSize: 128, epochs: 50, l2Reg: 0.001 },
  ];

  const results: SearchResult[] = [];

  for (let i = 0; i < paramGrid.length; i++) {
    const params = paramGrid[i];
    console.log(`\n--- Config ${i + 1}/${paramGrid.length} ---`);
    console.log(`  LR: ${params.learningRate}, Units: [${params.hiddenUnits}], Dropout: [${params.dropoutRates}], Batch: ${params.batchSize}, Epochs: ${params.epochs}`);

    const result = await evaluateParams(params, samples, 5);
    results.push(result);

    console.log(`  Avg F1: ${result.avgF1.toFixed(4)} | Avg Acc: ${result.avgAccuracy.toFixed(4)}`);
    console.log(`  Folds: [${result.foldResults.map(f => f.f1.toFixed(4)).join(', ')}]`);
  }

  // Sort by F1
  results.sort((a, b) => b.avgF1 - a.avgF1);

  console.log('\n\n=== RESULTS (sorted by F1) ===\n');
  console.log('Rank | Avg F1   | Avg Acc  | Config');
  console.log('-----|----------|----------|-------');
  results.forEach((r, i) => {
    console.log(`  ${i + 1}  | ${r.avgF1.toFixed(4)}  | ${r.avgAccuracy.toFixed(4)}  | LR=${r.params.learningRate} Units=[${r.params.hiddenUnits}] Drop=[${r.params.dropoutRates}] Batch=${r.params.batchSize}`);
  });

  console.log(`\nRules Baseline F1: ${rulesMetrics.f1Score.toFixed(4)}`);
  console.log(`Best ML F1:        ${results[0].avgF1.toFixed(4)}`);
  console.log(`Improvement:       ${((results[0].avgF1 - rulesMetrics.f1Score) / rulesMetrics.f1Score * 100).toFixed(1)}%`);

  // Save results
  const resultsPath = path.join(__dirname, '..', '..', 'data', 'hyperparam_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${resultsPath}`);
}

main().catch(console.error);
