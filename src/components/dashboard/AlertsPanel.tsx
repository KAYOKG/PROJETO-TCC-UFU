import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ShieldIcon from '@mui/icons-material/Shield';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useMLStore } from '../../store/useMLStore';

export function AlertsPanel() {
  const alerts = useMLStore(state => state.alerts);

  const formatTime = (dateStr: string) =>
    new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(dateStr));

  const mlCount = alerts.filter(a => a.isMlDetection).length;
  const ruleCount = alerts.length - mlCount;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 0, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon color="error" />
            Alertas em Tempo Real
          </Typography>
          <Badge badgeContent={alerts.length} color="error" max={99}>
            <NotificationsActiveIcon color="action" />
          </Badge>
        </Box>
        {alerts.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <Chip icon={<PsychologyIcon />} label={`ML: ${mlCount}`} size="small" color="error" variant="outlined" />
            <Chip icon={<ShieldIcon />} label={`Regras: ${ruleCount}`} size="small" color="warning" variant="outlined" />
          </Box>
        )}
      </CardContent>

      <Divider />

      <Box sx={{
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        maxHeight: 400,
        px: 2,
        py: 1.5,
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 3 },
      }}>
        {alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
            <ShieldIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography>Nenhum alerta detectado</Typography>
            <Typography variant="caption">Alertas aparecerão conforme ações forem analisadas</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {alerts.map(alert => (
              <Box
                key={alert.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: alert.isMlDetection ? 'error.200' : 'warning.200',
                  bgcolor: alert.isMlDetection ? 'rgba(211,47,47,0.04)' : 'rgba(237,108,2,0.04)',
                  transition: 'background-color 0.15s',
                  '&:hover': { bgcolor: alert.isMlDetection ? 'rgba(211,47,47,0.08)' : 'rgba(237,108,2,0.08)' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    {alert.isMlDetection
                      ? <PsychologyIcon fontSize="small" color="error" sx={{ mt: 0.2, flexShrink: 0 }} />
                      : <ShieldIcon fontSize="small" color="warning" sx={{ mt: 0.2, flexShrink: 0 }} />
                    }
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{alert.alertType}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>{alert.description}</Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={`${(alert.riskScore * 100).toFixed(0)}%`}
                    size="small"
                    color={alert.riskScore >= 0.8 ? 'error' : alert.riskScore >= 0.5 ? 'warning' : 'default'}
                    variant="filled"
                    sx={{ flexShrink: 0 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.75, pl: 3.5, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {alert.userName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <AccessTimeIcon sx={{ fontSize: 11 }} />
                    {formatTime(alert.createdAt)}
                  </Typography>
                  <Chip
                    label={alert.isMlDetection ? 'ML' : 'Regra'}
                    size="small"
                    variant="outlined"
                    color={alert.isMlDetection ? 'error' : 'warning'}
                    sx={{ height: 18, '& .MuiChip-label': { px: 0.75, fontSize: '0.6rem' } }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Card>
  );
}
