import GridOnIcon from '@mui/icons-material/GridOn';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
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

function MatrixGrid({ cm, total, label }: { cm: CM; total: number; label: string }) {
  const cells = [
    { value: cm.tn, pct: cm.tn / total, label: 'TN', good: true },
    { value: cm.fp, pct: cm.fp / total, label: 'FP', good: false },
    { value: cm.fn, pct: cm.fn / total, label: 'FN', good: false },
    { value: cm.tp, pct: cm.tp / total, label: 'TP', good: true },
  ];

  function cellColor(pct: number, good: boolean) {
    if (good) {
      if (pct > 0.4) return { bgcolor: 'success.main', color: 'success.contrastText' };
      if (pct > 0.2) return { bgcolor: 'success.light', color: '#fff' };
      if (pct > 0.1) return { bgcolor: '#c8e6c9', color: 'success.dark' };
      return { bgcolor: '#e8f5e9', color: 'success.dark' };
    }
    if (pct > 0.15) return { bgcolor: 'error.main', color: 'error.contrastText' };
    if (pct > 0.08) return { bgcolor: 'error.light', color: '#fff' };
    if (pct > 0.03) return { bgcolor: '#ffcdd2', color: 'error.dark' };
    return { bgcolor: '#ffebee', color: 'error.dark' };
  }

  return (
    <Box>
      <Typography variant="subtitle2" align="center" gutterBottom>{label}</Typography>
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', mr: 1 }}>
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            sx={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', textAlign: 'center', letterSpacing: 1 }}
          >
            REAL
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr', gap: 0.5, mb: 0.5 }}>
            <Box />
            <Typography variant="caption" fontWeight={600} color="text.secondary" align="center">Normal</Typography>
            <Typography variant="caption" fontWeight={600} color="text.secondary" align="center">Suspeito</Typography>
          </Box>

          {[0, 1].map(row => (
            <Box key={row} sx={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr', gap: 0.5, mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pr: 1 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  {row === 0 ? 'Normal' : 'Suspeito'}
                </Typography>
              </Box>
              {cells.slice(row * 2, row * 2 + 2).map((cell) => {
                const colors = cellColor(cell.pct, cell.good);
                return (
                  <Box
                    key={cell.label}
                    sx={{ ...colors, borderRadius: 2, p: 1.5, textAlign: 'center', transition: 'all 0.2s' }}
                  >
                    <Typography variant="h5" fontWeight={700}>{cell.value}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>{(cell.pct * 100).toFixed(1)}%</Typography>
                    <Typography variant="caption" display="block" sx={{ opacity: 0.6, mt: 0.5 }}>{cell.label}</Typography>
                  </Box>
                );
              })}
            </Box>
          ))}

          <Typography variant="caption" fontWeight={600} color="text.secondary" align="center" display="block" sx={{ mt: 1, letterSpacing: 1 }}>
            PREVISTO
          </Typography>
        </Box>
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
            <Grid size={{ xs: 12, lg: 6 }}><Skeleton variant="rounded" height={200} /></Grid>
            <Grid size={{ xs: 12, lg: 6 }}><Skeleton variant="rounded" height={200} /></Grid>
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
            <GridOnIcon color="error" />
            Matriz de Confusão
          </Typography>
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Execute o treinamento do modelo para ver a matriz de confusão
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const mlTotal = data.ml.tp + data.ml.fp + data.ml.tn + data.ml.fn;
  const rulesTotal = data.rules.tp + data.rules.fp + data.rules.tn + data.rules.fn;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <GridOnIcon color="error" />
          Matriz de Confusão
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
          Conjunto de teste: {data.testSize} amostras | Verde = classificação correta | Vermelho = erro
        </Typography>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <MatrixGrid cm={data.ml} total={mlTotal} label="Modelo ML (TensorFlow.js)" />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <MatrixGrid cm={data.rules} total={rulesTotal} label="Baseline de Regras Estáticas" />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 3, justifyContent: 'center' }}>
          <Chip label="TN = Verdadeiro Negativo" size="small" variant="outlined" />
          <Chip label="TP = Verdadeiro Positivo" size="small" variant="outlined" />
          <Chip label="FP = Falso Positivo" size="small" variant="outlined" />
          <Chip label="FN = Falso Negativo" size="small" variant="outlined" />
        </Box>
      </CardContent>
    </Card>
  );
}
