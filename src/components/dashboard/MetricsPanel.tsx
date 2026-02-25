import { AlertTriangle, Award, Brain, Shield, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { fetchTrainingMetrics } from '../../services/api';

interface Metrics {
  model_version: string;
  accuracy: number;
  precision_score: number;
  recall_score: number;
  f1_score: number;
  auc_roc: number;
  loss: number;
  val_accuracy: number;
  val_loss: number;
  epochs: number;
  dataset_size: number;
  training_time_ms: number;
}

function MetricCard({ label, value, icon: Icon, color }: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export function MetricsPanel() {
  const [mlMetrics, setMlMetrics] = useState<Metrics | null>(null);
  const [rulesMetrics, setRulesMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingMetrics()
      .then(res => {
        const metrics = res.metrics ?? [];
        const ml = metrics.find((m: Metrics) => m.model_version?.startsWith('v'));
        const rules = metrics.find((m: Metrics) => m.model_version?.startsWith('rules'));
        setMlMetrics(ml ?? null);
        setRulesMetrics(rules ?? null);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-400 text-center py-8">Carregando métricas...</p>
      </div>
    );
  }

  if (!mlMetrics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-400 text-center py-8">Execute o treinamento do modelo para ver métricas</p>
      </div>
    );
  }

  const improvement = rulesMetrics
    ? ((mlMetrics.f1_score - rulesMetrics.f1_score) / Math.max(rulesMetrics.f1_score, 0.001) * 100).toFixed(1)
    : 'N/A';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Award className="h-5 w-5 text-amber-500" />
        Métricas do Modelo
      </h3>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-purple-600" />
          <h4 className="font-medium text-purple-800">Modelo ML (TensorFlow.js)</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard label="Accuracy" value={`${(mlMetrics.accuracy * 100).toFixed(1)}%`} icon={TrendingUp} color="bg-blue-50 border-blue-200 text-blue-800" />
          <MetricCard label="Precision" value={`${(mlMetrics.precision_score * 100).toFixed(1)}%`} icon={TrendingUp} color="bg-green-50 border-green-200 text-green-800" />
          <MetricCard label="Recall" value={`${(mlMetrics.recall_score * 100).toFixed(1)}%`} icon={TrendingUp} color="bg-indigo-50 border-indigo-200 text-indigo-800" />
          <MetricCard label="F1-Score" value={`${(mlMetrics.f1_score * 100).toFixed(1)}%`} icon={Award} color="bg-purple-50 border-purple-200 text-purple-800" />
          <MetricCard label="AUC-ROC" value={mlMetrics.auc_roc.toFixed(4)} icon={TrendingUp} color="bg-amber-50 border-amber-200 text-amber-800" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {mlMetrics.epochs} epochs | Dataset: {mlMetrics.dataset_size} amostras | Treino: {(mlMetrics.training_time_ms / 1000).toFixed(1)}s
        </p>
      </div>

      {rulesMetrics && (
        <>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-gray-600" />
              <h4 className="font-medium text-gray-700">Baseline de Regras Estáticas</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="Accuracy" value={`${(rulesMetrics.accuracy * 100).toFixed(1)}%`} icon={TrendingUp} color="bg-gray-50 border-gray-200 text-gray-700" />
              <MetricCard label="Precision" value={`${(rulesMetrics.precision_score * 100).toFixed(1)}%`} icon={TrendingUp} color="bg-gray-50 border-gray-200 text-gray-700" />
              <MetricCard label="Recall" value={`${(rulesMetrics.recall_score * 100).toFixed(1)}%`} icon={TrendingUp} color="bg-gray-50 border-gray-200 text-gray-700" />
              <MetricCard label="F1-Score" value={`${(rulesMetrics.f1_score * 100).toFixed(1)}%`} icon={Award} color="bg-gray-50 border-gray-200 text-gray-700" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-1">Comparativo: ML vs. Regras</h4>
            <p className="text-sm text-purple-800">
              O modelo de ML supera o baseline de regras estáticas em <strong>{improvement}%</strong> no F1-Score,
              validando a hipótese do TCC de que a classificação supervisionada com TensorFlow.js
              melhora a detecção de comportamentos suspeitos.
            </p>
          </div>
        </>
      )}

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900 text-sm mb-1">Limitação: Dataset Sintético</h4>
            <p className="text-sm text-amber-800">
              As métricas acima foram obtidas com um dataset sintético cujos perfis de comportamento
              (normal vs. suspeito) possuem padrões bem definidos e separáveis por design. Em um cenário
              real, os comportamentos legítimos e maliciosos tendem a se sobrepor de forma mais sutil,
              produzindo separação menos clara entre classes. Espera-se, portanto, que as métricas em
              produção sejam inferiores às reportadas aqui. Esta ressalva é fundamental para a seção de
              limitações da monografia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
