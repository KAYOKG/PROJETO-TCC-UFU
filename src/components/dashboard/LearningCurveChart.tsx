import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceDot,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
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
      message: `Overfitting detectado: gap relativo treino/validação de ${(relativeGap * 100).toFixed(0)}% com loss de validação crescente nas últimas ${tail} épocas. Considere mais regularização, dropout, ou early stopping.`,
    };
  }

  if (relativeGap > 0.25) {
    return {
      status: 'mild',
      message: `Leve overfitting: gap relativo treino/validação de ${(relativeGap * 100).toFixed(0)}%. O modelo generaliza razoavelmente, mas pode se beneficiar de mais dados ou regularização.`,
    };
  }

  return {
    status: 'healthy',
    message: `Modelo saudável: gap relativo treino/validação de apenas ${(relativeGap * 100).toFixed(0)}%. As curvas convergem adequadamente, indicando boa generalização.`,
  };
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <Box sx={{
      px: 2, py: 1.25,
      borderRadius: 2,
      bgcolor: `${color}08`,
      border: '1px solid',
      borderColor: `${color}30`,
      textAlign: 'center',
      flex: 1,
      minWidth: 100,
    }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{label}</Typography>
      <Typography variant="h6" fontWeight={700} sx={{ color, lineHeight: 1.2 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{sub}</Typography>
    </Box>
  );
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
            <Grid size={{ xs: 12, lg: 6 }}><Skeleton variant="rounded" height={320} /></Grid>
            <Grid size={{ xs: 12, lg: 6 }}><Skeleton variant="rounded" height={320} /></Grid>
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
            Curva de Aprendizado
          </Typography>
          <Box sx={{
            textAlign: 'center', py: 6, color: 'text.disabled',
            border: '2px dashed', borderColor: 'grey.200', borderRadius: 3,
          }}>
            <ShowChartIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography>Execute o treinamento do modelo para ver a curva de aprendizado</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const diagnosis = diagnoseOverfitting(data);
  const totalEpochs = data.epochs.length;
  const finalTrainAcc = data.trainAcc[totalEpochs - 1] ?? 0;
  const finalValAcc = data.valAcc[totalEpochs - 1] ?? 0;
  const finalTrainLoss = data.trainLoss[totalEpochs - 1] ?? 0;
  const finalValLoss = data.valLoss[totalEpochs - 1] ?? 0;

  const bestValLoss = Math.min(...data.valLoss);
  const bestValLossEpoch = data.epochs[data.valLoss.indexOf(bestValLoss)];
  const bestValAcc = Math.max(...data.valAcc);
  const bestValAccEpoch = data.epochs[data.valAcc.indexOf(bestValAcc)];

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

  const tooltipStyle = { borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 12 };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShowChartIcon color="info" />
            Curva de Aprendizado
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip label={`${totalEpochs} épocas`} size="small" variant="outlined" />
            <Chip
              label={labelMap[diagnosis.status]}
              size="small"
              color={severityMap[diagnosis.status]}
              variant="filled"
              icon={iconMap[diagnosis.status]}
            />
          </Box>
        </Box>

        {/* Summary stats */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <StatCard
            label="Acurácia Treino"
            value={`${(finalTrainAcc * 100).toFixed(1)}%`}
            sub={`Loss: ${finalTrainLoss.toFixed(4)}`}
            color="#1565c0"
          />
          <StatCard
            label="Acurácia Validação"
            value={`${(finalValAcc * 100).toFixed(1)}%`}
            sub={`Loss: ${finalValLoss.toFixed(4)}`}
            color="#c62828"
          />
          <StatCard
            label="Melhor Validação Loss"
            value={bestValLoss.toFixed(4)}
            sub={`Época ${bestValLossEpoch}`}
            color="#2e7d32"
          />
          <StatCard
            label="Melhor Validação Acurácia"
            value={`${(bestValAcc * 100).toFixed(1)}%`}
            sub={`Época ${bestValAccEpoch}`}
            color="#6a1b9a"
          />
        </Box>

        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fafafa', border: '1px solid #eee' }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Loss por Época
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Quanto menor, melhor. Se validação diverge do treino, indica overfitting.
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 20 }}>
                  <defs>
                    <linearGradient id="gradTrainLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1565c0" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1565c0" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="gradValLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d32f2f" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#d32f2f" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="epoch"
                    fontSize={11}
                    label={{ value: 'Época', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#666' }}
                  />
                  <YAxis fontSize={11} label={{ value: 'Loss', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#666' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="trainLoss" fill="url(#gradTrainLoss)" stroke="none" />
                  <Area type="monotone" dataKey="valLoss" fill="url(#gradValLoss)" stroke="none" />
                  <Line type="monotone" dataKey="trainLoss" name="Loss de Treino" stroke="#1565c0" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#1565c0' }} />
                  <Line type="monotone" dataKey="valLoss" name="Loss de Validação" stroke="#d32f2f" strokeWidth={2} dot={false} strokeDasharray="6 3" activeDot={{ r: 4, fill: '#d32f2f' }} />
                  <ReferenceDot
                    x={bestValLossEpoch}
                    y={bestValLoss}
                    r={6}
                    fill="#2e7d32"
                    stroke="#fff"
                    strokeWidth={2}
                    label={{
                      value: `Melhor: ${bestValLoss.toFixed(4)} (época ${bestValLossEpoch})`,
                      position: 'top',
                      offset: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      fill: '#2e7d32',
                    }}
                  />
                  <ReferenceLine x={bestValLossEpoch} stroke="#2e7d32" strokeDasharray="3 3" strokeWidth={1} strokeOpacity={0.4} />
                </ComposedChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 20, height: 3, bgcolor: '#1565c0', borderRadius: 1 }} />
                  <Typography variant="caption">Loss de Treino</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 20, height: 3, bgcolor: '#d32f2f', borderRadius: 1, backgroundImage: 'repeating-linear-gradient(90deg, #d32f2f 0, #d32f2f 4px, transparent 4px, transparent 7px)' }} />
                  <Typography variant="caption">Loss de Validação</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: '#2e7d32', borderRadius: '50%' }} />
                  <Typography variant="caption">Melhor Ponto</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#fafafa', border: '1px solid #eee' }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Acurácia por Época
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Quanto maior, melhor. Curvas próximas indicam boa generalização.
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 20 }}>
                  <defs>
                    <linearGradient id="gradTrainAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1565c0" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1565c0" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="gradValAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d32f2f" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#d32f2f" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="epoch"
                    fontSize={11}
                    label={{ value: 'Época', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#666' }}
                  />
                  <YAxis
                    fontSize={11}
                    domain={[
                      Math.max(0, Math.floor(Math.min(...chartData.map(d => Math.min(d.trainAcc, d.valAcc))) - 5)),
                      100,
                    ]}
                    tickFormatter={(v) => `${v}%`}
                    label={{ value: 'Acurácia', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#666' }}
                  />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="trainAcc" fill="url(#gradTrainAcc)" stroke="none" />
                  <Area type="monotone" dataKey="valAcc" fill="url(#gradValAcc)" stroke="none" />
                  <Line type="monotone" dataKey="trainAcc" name="Acurácia de Treino" stroke="#1565c0" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#1565c0' }} />
                  <Line type="monotone" dataKey="valAcc" name="Acurácia de Validação" stroke="#d32f2f" strokeWidth={2} dot={false} strokeDasharray="6 3" activeDot={{ r: 4, fill: '#d32f2f' }} />
                  <ReferenceDot
                    x={bestValAccEpoch}
                    y={Number((bestValAcc * 100).toFixed(2))}
                    r={6}
                    fill="#6a1b9a"
                    stroke="#fff"
                    strokeWidth={2}
                    label={{
                      value: `Melhor: ${(bestValAcc * 100).toFixed(1)}% (época ${bestValAccEpoch})`,
                      position: 'bottom',
                      offset: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      fill: '#6a1b9a',
                    }}
                  />
                  <ReferenceLine x={bestValAccEpoch} stroke="#6a1b9a" strokeDasharray="3 3" strokeWidth={1} strokeOpacity={0.4} />
                </ComposedChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 20, height: 3, bgcolor: '#1565c0', borderRadius: 1 }} />
                  <Typography variant="caption">Acurácia de Treino</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 20, height: 3, bgcolor: '#d32f2f', borderRadius: 1, backgroundImage: 'repeating-linear-gradient(90deg, #d32f2f 0, #d32f2f 4px, transparent 4px, transparent 7px)' }} />
                  <Typography variant="caption">Acurácia de Validação</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: '#6a1b9a', borderRadius: '50%' }} />
                  <Typography variant="caption">Melhor Ponto</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

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
