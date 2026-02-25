import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useMLStore } from '../../store/useMLStore';

function RiskGauge({ score, label, rank }: { score: number; label: string; rank: number }) {
  const percentage = Math.round(score * 100);
  const color = score >= 0.7 ? 'error' : score >= 0.4 ? 'warning' : 'success';
  const bgMap = { error: 'rgba(211,47,47,0.06)', warning: 'rgba(237,108,2,0.06)', success: 'rgba(46,125,50,0.04)' };

  return (
    <Box sx={{
      px: 2,
      py: 1.25,
      borderRadius: 2,
      bgcolor: bgMap[color],
      border: '1px solid',
      borderColor: score >= 0.7 ? 'error.200' : score >= 0.4 ? 'warning.200' : 'grey.200',
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
          <Chip label={`#${rank}`} size="small" sx={{ height: 20, fontWeight: 700, minWidth: 30, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' } }} />
          <PersonIcon sx={{ fontSize: 16, color: `${color}.main`, flexShrink: 0 }} />
          <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>{label}</Typography>
        </Box>
        <Chip
          label={`${percentage}%`}
          size="small"
          color={color}
          variant="filled"
          sx={{ fontWeight: 700, flexShrink: 0, ml: 1 }}
        />
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={color}
        sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200' }}
      />
    </Box>
  );
}

export function UserRiskScore() {
  const userRiskScores = useMLStore(state => state.userRiskScores);
  const alertsSummary = useMLStore(state => state.alertsSummary);

  const sortedUsers = Array.from(userRiskScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const apiUsers = alertsSummary?.userRisks ?? [];

  const totalUsers = sortedUsers.length || apiUsers.length;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 0, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color="primary" />
            Score de Risco
          </Typography>
          {totalUsers > 0 && (
            <Chip label={`Top ${totalUsers}`} size="small" variant="outlined" color="primary" />
          )}
        </Box>
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
        {sortedUsers.length === 0 && apiUsers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
            <TrendingUpIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography>Sem dados de risco disponíveis</Typography>
            <Typography variant="caption">Scores aparecerão após análise de logs</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sortedUsers.length > 0 ? (
              sortedUsers.map(([userId, score], i) => (
                <RiskGauge key={userId} score={score} label={userId} rank={i + 1} />
              ))
            ) : (
              apiUsers.map((u: Record<string, unknown>, i: number) => (
                <RiskGauge
                  key={i}
                  score={(u.avg_risk as number) ?? 0}
                  label={`${u.user_name} (${u.alert_count} alertas)`}
                  rank={i + 1}
                />
              ))
            )}
          </Box>
        )}
      </Box>
    </Card>
  );
}
