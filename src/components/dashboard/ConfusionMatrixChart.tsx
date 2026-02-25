import GridOnIcon from '@mui/icons-material/GridOn';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { fetchConfusionMatrix } from '../../services/api';

interface CM {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

interface ConfusionData {
  ml: CM;
  rules: CM;
  testSize: number;
}

function computeMetrics(cm: CM) {
  const total = cm.tp + cm.fp + cm.tn + cm.fn;
  const accuracy = total > 0 ? (cm.tp + cm.tn) / total : 0;
  const precision = cm.tp + cm.fp > 0 ? cm.tp / (cm.tp + cm.fp) : 0;
  const recall = cm.tp + cm.fn > 0 ? cm.tp / (cm.tp + cm.fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { accuracy, precision, recall, f1, total };
}

function MetricChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem', mb: 0.25 }}>
        {label}
      </Typography>
      <Chip label={value} size="small" sx={{ fontWeight: 700, bgcolor: color, color: '#fff', minWidth: 62 }} />
    </Box>
  );
}

function MatrixGrid({ cm, label }: { cm: CM; label: string }) {
  const metrics = computeMetrics(cm);

  const cells: { value: number; pct: number; label: string; abbr: string; good: boolean }[] = [
    { value: cm.tn, pct: metrics.total > 0 ? cm.tn / metrics.total : 0, label: 'Verdadeiro Negativo', abbr: 'VN', good: true },
    { value: cm.fp, pct: metrics.total > 0 ? cm.fp / metrics.total : 0, label: 'Falso Positivo', abbr: 'FP', good: false },
    { value: cm.fn, pct: metrics.total > 0 ? cm.fn / metrics.total : 0, label: 'Falso Negativo', abbr: 'FN', good: false },
    { value: cm.tp, pct: metrics.total > 0 ? cm.tp / metrics.total : 0, label: 'Verdadeiro Positivo', abbr: 'VP', good: true },
  ];

  function cellStyle(pct: number, good: boolean) {
    if (good) {
      if (pct > 0.4) return { bgcolor: '#2e7d32', color: '#fff' };
      if (pct > 0.2) return { bgcolor: '#4caf50', color: '#fff' };
      if (pct > 0.1) return { bgcolor: '#a5d6a7', color: '#1b5e20' };
      return { bgcolor: '#c8e6c9', color: '#2e7d32' };
    }
    if (pct > 0.15) return { bgcolor: '#d32f2f', color: '#fff' };
    if (pct > 0.08) return { bgcolor: '#ef5350', color: '#fff' };
    if (pct > 0.03) return { bgcolor: '#ef9a9a', color: '#b71c1c' };
    if (pct > 0) return { bgcolor: '#ffcdd2', color: '#c62828' };
    return { bgcolor: '#e8f5e9', color: '#2e7d32' };
  }

  return (
    <Box>
      <Typography variant="subtitle2" align="center" fontWeight={700} gutterBottom>{label}</Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box>
          {/* Column headers */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '4px', mb: '4px' }}>
            <Box />
            <Typography variant="caption" fontWeight={700} color="text.secondary" align="center" sx={{ fontSize: '0.7rem' }}>
              Previsto Normal
            </Typography>
            <Typography variant="caption" fontWeight={700} color="text.secondary" align="center" sx={{ fontSize: '0.7rem' }}>
              Previsto Suspeito
            </Typography>
          </Box>

          {[0, 1].map(row => (
            <Box key={row} sx={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '4px', mb: '4px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {row === 0 ? 'Real Normal' : 'Real Suspeito'}
                </Typography>
              </Box>
              {cells.slice(row * 2, row * 2 + 2).map((cell) => {
                const style = cellStyle(cell.pct, cell.good);
                return (
                  <Box
                    key={cell.abbr}
                    sx={{
                      ...style,
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center',
                      minWidth: 100,
                      minHeight: 90,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      transition: 'transform 0.15s',
                      '&:hover': { transform: 'scale(1.03)' },
                    }}
                  >
                    <Typography variant="h4" fontWeight={800} lineHeight={1}>{cell.value}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85, mt: 0.5 }}>
                      {(cell.pct * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.7, mt: 0.25 }}>
                      {cell.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Metrics derived from this matrix */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2, flexWrap: 'wrap' }}>
        <MetricChip label="Accuracy" value={`${(metrics.accuracy * 100).toFixed(1)}%`} color="#1565c0" />
        <MetricChip label="Precision" value={`${(metrics.precision * 100).toFixed(1)}%`} color="#2e7d32" />
        <MetricChip label="Recall" value={`${(metrics.recall * 100).toFixed(1)}%`} color="#6a1b9a" />
        <MetricChip label="F1-Score" value={`${(metrics.f1 * 100).toFixed(1)}%`} color="#e65100" />
      </Box>
    </Box>
  );
}

export function ConfusionMatrixChart() {
  const [data, setData] = useState<ConfusionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfusionMatrix()
      .then(setData)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={250} height={32} />
          <Grid container spacing={4} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, lg: 6 }}><Skeleton variant="rounded" height={280} /></Grid>
            <Grid size={{ xs: 12, lg: 6 }}><Skeleton variant="rounded" height={280} /></Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!data?.ml || !data?.rules) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <GridOnIcon color="primary" />
            Matriz de Confusão
          </Typography>
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Execute o treinamento do modelo para ver a matriz de confusão
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <GridOnIcon color="primary" />
          Matriz de Confusão
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Conjunto de teste: <strong>{data.testSize}</strong> amostras
        </Typography>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <MatrixGrid cm={data.ml} label="Modelo ML (TensorFlow.js)" />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <MatrixGrid cm={data.rules} label="Baseline de Regras Estáticas" />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        <Typography variant="subtitle2" align="center" color="text.secondary" gutterBottom>
          Legenda
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 14, height: 14, borderRadius: 1, bgcolor: '#4caf50' }} />
            <Typography variant="caption">Verdadeiro Positivo — ação suspeita corretamente identificada</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 14, height: 14, borderRadius: 1, bgcolor: '#2e7d32' }} />
            <Typography variant="caption">Verdadeiro Negativo — ação normal corretamente classificada</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 14, height: 14, borderRadius: 1, bgcolor: '#ef5350' }} />
            <Typography variant="caption">Falso Positivo — ação normal incorretamente marcada como suspeita</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 14, height: 14, borderRadius: 1, bgcolor: '#ffcdd2', border: '1px solid #ef9a9a' }} />
            <Typography variant="caption">Falso Negativo — ação suspeita que passou despercebida</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
