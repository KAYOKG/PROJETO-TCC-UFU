import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
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
      <Card>
        <CardContent>
          <Skeleton variant="text" width={300} height={32} />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, lg: 6 }}><Skeleton variant="rounded" height={260} /></Grid>
            <Grid size={{ xs: 12, lg: 6 }}><Skeleton variant="rounded" height={260} /></Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.epochs?.length) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ShowChartIcon color="info" />
            Curva de Aprendizado (Learning Curve)
          </Typography>
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Execute o treinamento do modelo para ver a curva de aprendizado
          </Typography>
        </CardContent>
      </Card>
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

  const severityMap = { healthy: 'success', mild: 'warning', severe: 'error' } as const;
  const iconMap = { healthy: <CheckCircleIcon />, mild: <WarningAmberIcon />, severe: <ErrorIcon /> };
  const labelMap = { healthy: 'Saudável', mild: 'Leve Overfitting', severe: 'Overfitting Severo' };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ShowChartIcon color="info" />
          Curva de Aprendizado &mdash; Análise de Overfitting
        </Typography>

        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Loss por Época</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="epoch" fontSize={11} label={{ value: 'Época', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                <YAxis fontSize={11} label={{ value: 'Loss', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="trainLoss" name="Treino" stroke="#1565c0" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="valLoss" name="Validação" stroke="#d32f2f" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Acurácia por Época</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="epoch" fontSize={11} label={{ value: 'Época', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                <YAxis fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} label={{ value: 'Acurácia', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Legend />
                <Line type="monotone" dataKey="trainAcc" name="Treino" stroke="#1565c0" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="valAcc" name="Validação" stroke="#d32f2f" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </Grid>
        </Grid>

        <Alert severity={severityMap[diagnosis.status]} icon={iconMap[diagnosis.status]}>
          <Typography variant="subtitle2" gutterBottom>
            Diagnóstico: {labelMap[diagnosis.status]}
          </Typography>
          <Typography variant="body2">{diagnosis.message}</Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}
