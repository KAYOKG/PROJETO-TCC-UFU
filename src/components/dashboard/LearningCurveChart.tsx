import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis,
} from 'recharts';
import { fetchLearningCurve } from '../../services/api';

interface LearningCurveData {
  epochs: number[];
  trainLoss: number[];
  valLoss: number[];
  trainAcc: number[];
  valAcc: number[];
}

function diagnoseOverfitting(data: LearningCurveData): {
  status: 'healthy' | 'mild' | 'severe';
  message: string;
} {
  const n = data.epochs.length;
  if (n < 5) return { status: 'healthy', message: 'Poucas épocas para diagnosticar.' };

  const lastTrainLoss = data.trainLoss[n - 1];
  const lastValLoss = data.valLoss[n - 1];
  const gap = lastValLoss - lastTrainLoss;
  const relativeGap = gap / Math.max(lastTrainLoss, 1e-6);

  const tail = Math.max(5, Math.floor(n * 0.3));
  const valLossTail = data.valLoss.slice(n - tail);
  const valLossTrend = valLossTail[valLossTail.length - 1] - valLossTail[0];

  if (relativeGap > 0.5 && valLossTrend > 0) {
    return {
      status: 'severe',
      message: `Overfitting detectado: gap relativo train/val de ${(relativeGap * 100).toFixed(0)}% com val_loss crescente nas últimas ${tail} épocas. Considere mais regularização, dropout, ou early stopping.`,
    };
  }

  if (relativeGap > 0.25) {
    return {
      status: 'mild',
      message: `Leve overfitting: gap relativo train/val de ${(relativeGap * 100).toFixed(0)}%. O modelo generaliza razoavelmente, mas pode se beneficiar de mais dados ou regularização.`,
    };
  }

  return {
    status: 'healthy',
    message: `Modelo saudável: gap relativo train/val de apenas ${(relativeGap * 100).toFixed(0)}%. As curvas convergem adequadamente.`,
  };
}

export function LearningCurveChart() {
  const [data, setData] = useState<LearningCurveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLearningCurve()
      .then(setData)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-400 text-center py-8">Carregando curva de aprendizado...</p>
      </div>
    );
  }

  if (!data || !data.epochs?.length) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-teal-500" />
          Curva de Aprendizado (Learning Curve)
        </h3>
        <p className="text-gray-400 text-center py-8">
          Execute o treinamento do modelo para ver a curva de aprendizado
        </p>
      </div>
    );
  }

  const diagnosis = diagnoseOverfitting(data);

  const chartData = data.epochs.map((epoch, i) => ({
    epoch,
    trainLoss: Number(data.trainLoss[i]?.toFixed(5)),
    valLoss: Number(data.valLoss[i]?.toFixed(5)),
    trainAcc: Number(((data.trainAcc[i] ?? 0) * 100).toFixed(2)),
    valAcc: Number(((data.valAcc[i] ?? 0) * 100).toFixed(2)),
  }));

  const statusConfig = {
    healthy: { color: 'bg-green-50 border-green-200 text-green-800', Icon: CheckCircle, iconColor: 'text-green-600' },
    mild: { color: 'bg-yellow-50 border-yellow-200 text-yellow-800', Icon: AlertTriangle, iconColor: 'text-yellow-600' },
    severe: { color: 'bg-red-50 border-red-200 text-red-800', Icon: AlertTriangle, iconColor: 'text-red-600' },
  };
  const { color, Icon, iconColor } = statusConfig[diagnosis.status];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-teal-500" />
        Curva de Aprendizado &mdash; Análise de Overfitting
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">Loss por Época</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="epoch" fontSize={11} label={{ value: 'Época', position: 'insideBottom', offset: -2, fontSize: 11 }} />
              <YAxis fontSize={11} label={{ value: 'Loss', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="trainLoss" name="Treino" stroke="#7c3aed" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="valLoss" name="Validação" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">Acurácia por Época</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="epoch" fontSize={11} label={{ value: 'Época', position: 'insideBottom', offset: -2, fontSize: 11 }} />
              <YAxis fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} label={{ value: 'Acurácia', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Legend />
              <Line type="monotone" dataKey="trainAcc" name="Treino" stroke="#7c3aed" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="valAcc" name="Validação" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`rounded-lg border p-4 ${color}`}>
        <div className="flex items-start gap-2">
          <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
          <div>
            <h4 className="font-semibold text-sm mb-1">
              Diagnóstico: {diagnosis.status === 'healthy' ? 'Saudável' : diagnosis.status === 'mild' ? 'Leve Overfitting' : 'Overfitting Severo'}
            </h4>
            <p className="text-sm">{diagnosis.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
