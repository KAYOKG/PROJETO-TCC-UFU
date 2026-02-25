import TimelineIcon from '@mui/icons-material/Timeline';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
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
        avgScore: Number((data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(4)),
        maxScore: Number(Math.max(...data.scores).toFixed(4)),
        count: data.count,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [predictions]);

  const latestAvg = chartData.length > 0 ? chartData[chartData.length - 1].avgScore : 0;
  const latestMax = chartData.length > 0 ? chartData[chartData.length - 1].maxScore : 0;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon color="primary" />
            Score de Risco ao Longo do Tempo
          </Typography>
          {chartData.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              <Chip label={`Médio: ${(latestAvg * 100).toFixed(0)}%`} size="small" color="primary" variant="outlined" />
              <Chip label={`Máx: ${(latestMax * 100).toFixed(0)}%`} size="small" color="error" variant="outlined" />
            </Box>
          )}
        </Box>

        {chartData.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            py: 6,
            color: 'text.disabled',
            border: '2px dashed',
            borderColor: 'grey.200',
            borderRadius: 3,
          }}>
            <TimelineIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography>Dados aparecerão conforme ações forem realizadas</Typography>
            <Typography variant="caption">O gráfico agrupa scores por janelas de 5 minutos</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientAvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1565c0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1565c0" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradientMax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d32f2f" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#d32f2f" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="time" fontSize={11} />
              <YAxis domain={[0, 1]} fontSize={11} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip
                formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                labelFormatter={(label) => `Horário: ${label}`}
                contentStyle={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
              />
              <Legend />
              <Area type="monotone" dataKey="avgScore" name="Score Médio" stroke="#1565c0" fill="url(#gradientAvg)" strokeWidth={2} />
              <Area type="monotone" dataKey="maxScore" name="Score Máximo" stroke="#d32f2f" fill="url(#gradientMax)" strokeWidth={1.5} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
