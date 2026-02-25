import PsychologyIcon from '@mui/icons-material/Psychology';
import TuneIcon from '@mui/icons-material/Tune';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import { useMLStore } from '../../store/useMLStore';
import { AlertsPanel } from './AlertsPanel';
import { AnomalyChart } from './AnomalyChart';
import { ConfusionMatrixChart } from './ConfusionMatrixChart';
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PsychologyIcon color="primary" />
          Dashboard de Análise Comportamental
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
            <TuneIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" noWrap>Threshold:</Typography>
            <Slider
              value={threshold}
              onChange={(_e, v) => setThreshold(v as number)}
              min={0.3}
              max={0.95}
              step={0.05}
              size="small"
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
              sx={{ width: 100 }}
            />
            <Typography variant="body2" fontWeight={600} sx={{ minWidth: 36 }}>
              {(threshold * 100).toFixed(0)}%
            </Typography>
          </Box>

          <Chip
            icon={modelLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
            label={modelLoaded ? 'Modelo Ativo' : modelLoading ? 'Carregando...' : 'Modelo Offline'}
            color={modelLoaded ? 'success' : modelLoading ? 'warning' : 'default'}
            variant="filled"
            size="small"
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <MetricsPanel />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <AlertsPanel />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <UserRiskScore />
          </Grid>
        </Grid>

        <ConfusionMatrixChart />
        <LearningCurveChart />
        <AnomalyChart />
        <FeatureImportance />
      </Box>
    </Box>
  );
}
