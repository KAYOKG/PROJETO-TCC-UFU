import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { useMLStore } from '../../store/useMLStore';
import { BarChart3 } from 'lucide-react';

export function AnomalyChart() {
  const predictions = useMLStore(state => state.predictions);

  const chartData = useMemo(() => {
    if (predictions.length === 0) return [];

    const grouped = new Map<string, { scores: number[]; count: number }>();

    for (const pred of predictions) {
      const time = new Date(pred.timestamp);
      const key = `${time.getHours().toString().padStart(2, '0')}:${Math.floor(time.getMinutes() / 5) * 5 === 0 ? '00' : (Math.floor(time.getMinutes() / 5) * 5).toString().padStart(2, '0')}`;

      if (!grouped.has(key)) {
        grouped.set(key, { scores: [], count: 0 });
      }
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
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-indigo-500" />
        Score de Risco ao Longo do Tempo
      </h3>

      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-2" />
          <p>Dados aparecerão conforme ações forem realizadas</p>
        </div>
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
            <Area
              type="monotone"
              dataKey="avgScore"
              name="Score Médio"
              stroke="#6366f1"
              fill="#c7d2fe"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="maxScore"
              name="Score Máximo"
              stroke="#ef4444"
              fill="#fecaca"
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
