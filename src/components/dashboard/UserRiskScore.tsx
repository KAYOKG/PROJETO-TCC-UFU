import React from 'react';
import { useMLStore } from '../../store/useMLStore';
import { Users, TrendingUp } from 'lucide-react';

function RiskGauge({ score, label }: { score: number; label: string }) {
  const percentage = Math.round(score * 100);
  const color = score >= 0.7 ? 'text-red-600' : score >= 0.4 ? 'text-orange-500' : 'text-green-500';
  const bgColor = score >= 0.7 ? 'bg-red-500' : score >= 0.4 ? 'bg-orange-400' : 'bg-green-400';
  const bgTrack = 'bg-gray-200';

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
        <div className="w-full h-2 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: '#e5e7eb' }}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${bgColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span className={`text-sm font-bold ${color} w-12 text-right`}>
        {percentage}%
      </span>
    </div>
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
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-blue-500" />
        Score de Risco por Usuário
      </h3>

      {sortedUsers.length === 0 && apiUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <TrendingUp className="h-12 w-12 mx-auto mb-2" />
          <p>Sem dados de risco disponíveis</p>
        </div>
      ) : (
        <div className="space-y-1">
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
        </div>
      )}
    </div>
  );
}
