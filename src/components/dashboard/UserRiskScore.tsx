import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useMLStore } from '../../store/useMLStore';

function RiskGauge({ score, label }: { score: number; label: string }) {
  const percentage = Math.round(score * 100);
  const color = score >= 0.7 ? 'error' : score >= 0.4 ? 'warning' : 'success';

  return (
    <Box sx={{ py: 0.75 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>{label}</Typography>
        <Typography variant="body2" fontWeight={700} color={`${color}.main`}>{percentage}%</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={color}
        sx={{ height: 6, borderRadius: 3 }}
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

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PeopleIcon color="primary" />
          Score de Risco por Usuário
        </Typography>

        {sortedUsers.length === 0 && apiUsers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
            <TrendingUpIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography>Sem dados de risco disponíveis</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {sortedUsers.length > 0 ? (
              sortedUsers.map(([userId, score]) => (
                <RiskGauge key={userId} score={score} label={userId} />
              ))
            ) : (
              apiUsers.map((u: Record<string, unknown>, i: number) => (
                <RiskGauge
                  key={i}
                  score={(u.avg_risk as number) ?? 0}
                  label={`${u.user_name} (${u.alert_count} alertas)`}
                />
              ))
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
