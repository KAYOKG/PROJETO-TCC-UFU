import PsychologyIcon from '@mui/icons-material/Psychology';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScienceIcon from '@mui/icons-material/Science';
import TuneIcon from '@mui/icons-material/Tune';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLogStore } from '../../store/useLogStore';
import { useMLStore } from '../../store/useMLStore';
import { AlertsPanel } from './AlertsPanel';
import { AnomalyChart } from './AnomalyChart';
import { ConfusionMatrixChart } from './ConfusionMatrixChart';
import { FeatureImportance } from './FeatureImportance';
import { LearningCurveChart } from './LearningCurveChart';
import { MetricsPanel } from './MetricsPanel';
import { UserRiskScore } from './UserRiskScore';

const SENSITIVE_ACTIONS = [
  { action: 'Visualizar contrato', module: 'Contratos' },
  { action: 'Exportar dados', module: 'Gestão' },
  { action: 'Acesso a dados sensíveis', module: 'Sistema' },
  { action: 'Alteração de configuração', module: 'Sistema' },
  { action: 'Exportar relatório', module: 'Contratos' },
  { action: 'Visualizar documento confidencial', module: 'Contratos' },
];

const SIMULATE_TARGET_USERS = [
  { id: 'user1', name: 'user1' },
  { id: 'user2', name: 'user2' },
] as const;

export function RiskDashboard() {
  const { modelLoaded, modelLoading, modelError, initializeModel, retryModelLoad, loadDashboardData, threshold, setThreshold } = useMLStore();
  const role = useAuthStore((s) => s.user?.role);
  const [simulating, setSimulating] = useState(false);
  const [simulateTargetUser, setSimulateTargetUser] = useState<string>('user1');
  const showSimulate = role === 'superadmin' || import.meta.env.DEV;

  useEffect(() => {
    initializeModel();
    loadDashboardData();
  }, []);

  const runSimulateSuspicious = async () => {
    if (simulating || !modelLoaded) return;
    setSimulating(true);
    const targetId = SIMULATE_TARGET_USERS.some((u) => u.id === simulateTargetUser) ? simulateTargetUser : 'user1';
    const targetName = SIMULATE_TARGET_USERS.find((u) => u.id === targetId)?.name ?? 'user1';
    const addLog = useLogStore.getState().addLog;
    const iterations = 18;
    const delayMs = 400;
    for (let i = 0; i < iterations; i++) {
      const { action, module } = SENSITIVE_ACTIONS[i % SENSITIVE_ACTIONS.length];
      addLog({
        userName: targetName,
        userId: targetId,
        accessLevel: 'user',
        action,
        details: `Simulação de ação suspeita #${i + 1} - ${action}`,
        origin: { module, device: navigator.platform, browser: navigator.userAgent },
        result: 'success',
      });
      await new Promise((r) => setTimeout(r, delayMs));
    }
    setSimulating(false);
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PsychologyIcon color="primary" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h5" fontWeight={700} lineHeight={1.2}>Dashboard ML</Typography>
                <Typography variant="caption" color="text.secondary">Análise Comportamental em Tempo Real</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                <TuneIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary" noWrap>Limiar de Decisão:</Typography>
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
                <Chip label={`${(threshold * 100).toFixed(0)}%`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
              </Box>

              <Divider orientation="vertical" flexItem />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                  icon={modelLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
                  label={modelLoaded ? 'Modelo Ativo' : modelLoading ? 'Carregando...' : modelError ? 'Erro ao Carregar' : 'Modelo Offline'}
                  color={modelLoaded ? 'success' : modelLoading ? 'warning' : modelError ? 'error' : 'default'}
                  variant="filled"
                  size="small"
                />
                {!modelLoaded && !modelLoading && (
                  <Tooltip title="Tentar reconectar ao modelo e recarregar dados">
                    <IconButton size="small" onClick={retryModelLoad} color="primary">
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {showSimulate && (
                <>
                  <Divider orientation="vertical" flexItem />
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="simulate-user-label">Usuário alvo</InputLabel>
                    <Select
                      labelId="simulate-user-label"
                      value={simulateTargetUser}
                      label="Usuário alvo"
                      onChange={(e) => setSimulateTargetUser(e.target.value)}
                    >
                      {SIMULATE_TARGET_USERS.map((u) => (
                        <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Tooltip title="Dispara ações de negócio simuladas para o usuário alvo (detecção e bloqueio)">
                    <span>
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={simulating ? <CircularProgress size={16} color="inherit" /> : <ScienceIcon />}
                        onClick={runSimulateSuspicious}
                        disabled={simulating || !modelLoaded}
                      >
                        {simulating ? 'Simulando...' : 'Simular Ações Suspeitas'}
                      </Button>
                    </span>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Metrics */}
      <Box sx={{ mb: 3 }}>
        <MetricsPanel />
      </Box>

      {/* Alerts + Risk Scores side by side */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <AlertsPanel />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <UserRiskScore />
        </Grid>
      </Grid>

      {/* Confusion Matrix */}
      <Box sx={{ mb: 3 }}>
        <ConfusionMatrixChart />
      </Box>

      {/* Learning Curve */}
      <Box sx={{ mb: 3 }}>
        <LearningCurveChart />
      </Box>

      {/* Charts: Anomaly + Feature Importance side by side on desktop */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <AnomalyChart />
        </Grid>
        <Grid size={{ xs: 12, xl: 6 }}>
          <FeatureImportance />
        </Grid>
      </Grid>
    </Box>
  );
}
