import { Brain, Loader2, Settings2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { useMLStore } from '../../store/useMLStore';
import { AlertsPanel } from './AlertsPanel';
import { AnomalyChart } from './AnomalyChart';
import { FeatureImportance } from './FeatureImportance';
import { LearningCurveChart } from './LearningCurveChart';
import { MetricsPanel } from './MetricsPanel';
import { UserRiskScore } from './UserRiskScore';

export function RiskDashboard() {
  const { modelLoaded, modelLoading, initializeModel, loadDashboardData, threshold, setThreshold } = useMLStore();

  useEffect(() => {
    initializeModel();
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          Dashboard de Análise Comportamental
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-gray-500" />
            <label className="text-sm text-gray-600">Threshold:</label>
            <input
              type="range"
              min="0.3"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm font-medium text-gray-700 w-12">{(threshold * 100).toFixed(0)}%</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${modelLoaded
              ? 'bg-green-100 text-green-800'
              : modelLoading
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-600'
            }`}>
            {modelLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className={`h-2 w-2 rounded-full ${modelLoaded ? 'bg-green-500' : 'bg-gray-400'
                }`} />
            )}
            {modelLoaded ? 'Modelo Ativo' : modelLoading ? 'Carregando...' : 'Modelo Offline'}
          </div>
        </div>
      </div>

      {/* Metrics Panel - full width */}
      <MetricsPanel />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsPanel />
        <UserRiskScore />
      </div>

      {/* Learning Curve - Overfitting Analysis */}
      <LearningCurveChart />

      {/* Charts */}
      <AnomalyChart />
      <FeatureImportance />
    </div>
  );
}
