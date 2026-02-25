import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ShieldIcon from '@mui/icons-material/Shield';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
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

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card variant="outlined" sx={{ bgcolor: color, height: '100%' }}>
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700}>{value}</Typography>
      </CardContent>
    </Card>
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
      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} height={32} />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[...Array(5)].map((_, i) => (
              <Grid key={i} size={{ xs: 6, md: 2.4 }}><Skeleton variant="rounded" height={80} /></Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!mlMetrics) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Execute o treinamento do modelo para ver métricas
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const improvement = rulesMetrics
    ? ((mlMetrics.f1_score - rulesMetrics.f1_score) / Math.max(rulesMetrics.f1_score, 0.001) * 100).toFixed(1)
    : 'N/A';

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EmojiEventsIcon color="warning" />
          Métricas do Modelo
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <PsychologyIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" color="primary.dark">Modelo ML (TensorFlow.js)</Typography>
          </Box>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <MetricCard label="Accuracy" value={`${(mlMetrics.accuracy * 100).toFixed(1)}%`} color="#e3f2fd" />
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <MetricCard label="Precision" value={`${(mlMetrics.precision_score * 100).toFixed(1)}%`} color="#e8f5e9" />
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <MetricCard label="Recall" value={`${(mlMetrics.recall_score * 100).toFixed(1)}%`} color="#e8eaf6" />
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <MetricCard label="F1-Score" value={`${(mlMetrics.f1_score * 100).toFixed(1)}%`} color="#f3e5f5" />
            </Grid>
            <Grid size={{ xs: 6, md: 2.4 }}>
              <MetricCard label="AUC-ROC" value={mlMetrics.auc_roc.toFixed(4)} color="#fff8e1" />
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {mlMetrics.epochs} epochs | Dataset: {mlMetrics.dataset_size} amostras | Treino: {(mlMetrics.training_time_ms / 1000).toFixed(1)}s
          </Typography>
        </Box>

        {rulesMetrics && (
          <>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <ShieldIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" color="text.secondary">Baseline de Regras Estáticas</Typography>
              </Box>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <MetricCard label="Accuracy" value={`${(rulesMetrics.accuracy * 100).toFixed(1)}%`} color="#fafafa" />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <MetricCard label="Precision" value={`${(rulesMetrics.precision_score * 100).toFixed(1)}%`} color="#fafafa" />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <MetricCard label="Recall" value={`${(rulesMetrics.recall_score * 100).toFixed(1)}%`} color="#fafafa" />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <MetricCard label="F1-Score" value={`${(rulesMetrics.f1_score * 100).toFixed(1)}%`} color="#fafafa" />
                </Grid>
              </Grid>
            </Box>

            <Alert
              severity="info"
              icon={<TrendingUpIcon />}
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle2" gutterBottom>Comparativo: ML vs. Regras</Typography>
              <Typography variant="body2">
                O modelo de ML supera o baseline de regras estáticas em <strong>{improvement}%</strong> no F1-Score,
                validando a hipótese do TCC de que a classificação supervisionada com TensorFlow.js
                melhora a detecção de comportamentos suspeitos.
              </Typography>
            </Alert>
          </>
        )}

        <Alert severity="warning" icon={<WarningAmberIcon />}>
          <Typography variant="subtitle2" gutterBottom>Limitação: Dataset Sintético</Typography>
          <Typography variant="body2">
            As métricas acima foram obtidas com um dataset sintético cujos perfis de comportamento
            (normal vs. suspeito) possuem padrões bem definidos e separáveis por design. Em um cenário
            real, os comportamentos legítimos e maliciosos tendem a se sobrepor de forma mais sutil,
            produzindo separação menos clara entre classes. Espera-se, portanto, que as métricas em
            produção sejam inferiores às reportadas aqui. Esta ressalva é fundamental para a seção de
            limitações da monografia.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}
