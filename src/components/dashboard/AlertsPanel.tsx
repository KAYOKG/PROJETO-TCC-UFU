import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ShieldIcon from '@mui/icons-material/Shield';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useMLStore } from '../../store/useMLStore';

export function AlertsPanel() {
  const alerts = useMLStore(state => state.alerts);

  const formatTime = (dateStr: string) =>
    new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(dateStr));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon color="error" />
            Alertas em Tempo Real
          </Typography>
          <Badge badgeContent={alerts.length} color="error" max={99}>
            <Chip label="alertas" size="small" variant="outlined" />
          </Badge>
        </Box>

        <Box sx={{ maxHeight: 380, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {alerts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
              <ShieldIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography>Nenhum alerta detectado</Typography>
            </Box>
          ) : (
            alerts.map(alert => (
              <Card
                key={alert.id}
                variant="outlined"
                sx={{
                  bgcolor: alert.isMlDetection ? 'error.50' : 'warning.50',
                  borderColor: alert.isMlDetection ? 'error.200' : 'warning.200',
                }}
              >
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flex: 1 }}>
                      {alert.isMlDetection
                        ? <PsychologyIcon fontSize="small" color="error" sx={{ mt: 0.3 }} />
                        : <ShieldIcon fontSize="small" color="warning" sx={{ mt: 0.3 }} />
                      }
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{alert.alertType}</Typography>
                        <Typography variant="caption" color="text.secondary">{alert.description}</Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={`${(alert.riskScore * 100).toFixed(0)}%`}
                      size="small"
                      color={alert.riskScore >= 0.8 ? 'error' : alert.riskScore >= 0.5 ? 'warning' : 'default'}
                      variant="filled"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {alert.userName} ({alert.userId})
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 12 }} />
                      {formatTime(alert.createdAt)}
                    </Typography>
                    <Chip
                      label={alert.isMlDetection ? 'ML' : 'Regra'}
                      size="small"
                      variant="outlined"
                      color={alert.isMlDetection ? 'secondary' : 'default'}
                      sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.65rem' } }}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
