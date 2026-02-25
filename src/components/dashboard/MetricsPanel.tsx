import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ShieldIcon from '@mui/icons-material/Shield';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
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

interface MetricBarProps {
  label: string;
  mlValue: number;
  rulesValue: number | null;
  format?: 'percent' | 'decimal';
}

function MetricBar({ label, mlValue, rulesValue, format = 'percent' }: MetricBarProps) {
  const mlDisplay = format === 'percent' ? `${(mlValue * 100).toFixed(1)}%` : mlValue.toFixed(4);
  const rulesDisplay = rulesValue !== null
    ? (format === 'percent' ? `${(rulesValue * 100).toFixed(1)}%` : rulesValue.toFixed(4))
    : '—';
  const mlPct = format === 'percent' ? mlValue * 100 : Math.min(mlValue * 100, 100);
  const rulesPct = rulesValue !== null ? (format === 'percent' ? rulesValue * 100 : Math.min(rulesValue * 100, 100)) : 0;
  const diff = rulesValue !== null && format === 'percent'
    ? ((mlValue - rulesValue) * 100).toFixed(1)
    : null;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={mlDisplay} size="small" sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0', height: 22 }} />
          {rulesValue !== null && (
            <Chip label={rulesDisplay} size="small" sx={{ fontWeight: 600, bgcolor: '#f5f5f5', color: '#666', height: 22 }} />
          )}
          {diff && Number(diff) > 0 && (
            <Tooltip title="Melhoria do ML sobre regras">
              <Chip
                icon={<ArrowUpwardIcon sx={{ fontSize: 12 }} />}
                label={`+${diff}pp`}
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.65rem' } }}
              />
            </Tooltip>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Modelo ML">
          <LinearProgress
            variant="determinate"
            value={mlPct}
            sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: '#e3f2fd', '& .MuiLinearProgress-bar': { bgcolor: '#1565c0', borderRadius: 4 } }}
          />
        </Tooltip>
        {rulesValue !== null && (
          <Tooltip title="Baseline de Regras">
            <LinearProgress
              variant="determinate"
              value={rulesPct}
              sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: '#f5f5f5', '& .MuiLinearProgress-bar': { bgcolor: '#9e9e9e', borderRadius: 4 } }}
            />
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

export function MetricsPanel() {
  const [mlMetrics, setMlMetrics] = useState<Metrics | null>(null);
  const [rulesMetrics, setRulesMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadMetrics = () => {
    setLoading(true);
    setError(false);
    fetchTrainingMetrics()
      .then(res => {
        const metrics = res.metrics ?? [];
        const ml = metrics.find((m: Metrics) => m.model_version?.startsWith('v'));
        const rules = metrics.find((m: Metrics) => m.model_version?.startsWith('rules'));
        setMlMetrics(ml ?? null);
        setRulesMetrics(rules ?? null);
      })
      .catch(() => { setError(true); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMetrics(); }, []);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} height={32} />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[...Array(5)].map((_, i) => (
              <Grid key={i} size={{ xs: 12 }}><Skeleton variant="rounded" height={48} /></Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!mlMetrics) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary" gutterBottom>
            {error
              ? 'Não foi possível conectar ao backend. Verifique se o servidor está rodando na porta 3001.'
              : 'Execute o treinamento do modelo para ver métricas (npm run train no servidor).'
            }
          </Typography>
          <Button variant="outlined" size="small" startIcon={<TrendingUpIcon />} onClick={loadMetrics} sx={{ mt: 1 }}>
            Tentar Novamente
          </Button>
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon color="warning" />
            Métricas do Modelo
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip icon={<PsychologyIcon />} label="ML" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }} />
            {rulesMetrics && (
              <Chip icon={<ShieldIcon />} label="Regras" size="small" sx={{ bgcolor: '#f5f5f5', color: '#666' }} />
            )}
          </Box>
        </Box>

        <MetricBar label="Accuracy" mlValue={mlMetrics.accuracy} rulesValue={rulesMetrics?.accuracy ?? null} />
        <MetricBar label="Precision" mlValue={mlMetrics.precision_score} rulesValue={rulesMetrics?.precision_score ?? null} />
        <MetricBar label="Recall" mlValue={mlMetrics.recall_score} rulesValue={rulesMetrics?.recall_score ?? null} />
        <MetricBar label="F1-Score" mlValue={mlMetrics.f1_score} rulesValue={rulesMetrics?.f1_score ?? null} />
        <MetricBar label="AUC-ROC" mlValue={mlMetrics.auc_roc} rulesValue={null} format="decimal" />

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={`${mlMetrics.epochs} epochs`} size="small" variant="outlined" />
          <Chip label={`${mlMetrics.dataset_size} amostras`} size="small" variant="outlined" />
          <Chip label={`Treino: ${(mlMetrics.training_time_ms / 1000).toFixed(1)}s`} size="small" variant="outlined" />
        </Box>

        {rulesMetrics && (
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
        )}

        <Alert severity="warning" icon={<WarningAmberIcon />}>
          <Typography variant="subtitle2" gutterBottom>Limitação: Dataset Sintético</Typography>
          <Typography variant="body2">
            As métricas acima foram obtidas com um dataset sintético cujos perfis de comportamento
            (normal vs. suspeito) possuem padrões bem definidos e separáveis por design. Em cenário
            real, espera-se métricas inferiores. Ressalva fundamental para a seção de limitações.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}
