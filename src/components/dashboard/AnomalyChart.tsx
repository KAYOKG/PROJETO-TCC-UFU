import TimelineIcon from '@mui/icons-material/Timeline';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend, ResponsiveContainer,
  Tooltip,
  XAxis, YAxis,
} from 'recharts';
import { useMLStore } from '../../store/useMLStore';

export function AnomalyChart() {
  const predictions = useMLStore(state => state.predictions);

  const chartData = useMemo(() => {
    if (predictions.length === 0) return [];

    const grouped = new Map<string, { scores: number[]; count: number }>();

    for (const pred of predictions) {
      const time = new Date(pred.timestamp);
      const key = `${time.getHours().toString().padStart(2, '0')}:${(Math.floor(time.getMinutes() / 5) * 5).toString().padStart(2, '0')}`;

      if (!grouped.has(key)) grouped.set(key, { scores: [], count: 0 });
      const g = grouped.get(key)!;
      g.scores.push(pred.riskScore);
      g.count++;
    }

    return Array.from(grouped.entries())
      .map(([time, data]) => ({
        time,
        avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        maxScore: Math.max(...data.scores),
        count: data.count,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [predictions]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TimelineIcon color="primary" />
          Score de Risco ao Longo do Tempo
        </Typography>

        {chartData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
            <TimelineIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography>Dados aparecerão conforme ações forem realizadas</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" fontSize={12} />
              <YAxis domain={[0, 1]} fontSize={12} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip
                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                labelFormatter={(label) => `Horário: ${label}`}
              />
              <Legend />
              <Area type="monotone" dataKey="avgScore" name="Score Médio" stroke="#1565c0" fill="#bbdefb" strokeWidth={2} />
              <Area type="monotone" dataKey="maxScore" name="Score Máximo" stroke="#d32f2f" fill="#ffcdd2" strokeWidth={1} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
