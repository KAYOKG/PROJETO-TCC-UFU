import React from 'react';
import { useMLStore } from '../../store/useMLStore';
import { AlertTriangle, Shield, Brain, Clock } from 'lucide-react';

export function AlertsPanel() {
  const alerts = useMLStore(state => state.alerts);

  const formatTime = (dateStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateStr));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Alertas em Tempo Real
        </h3>
        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {alerts.length} alertas
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Shield className="h-12 w-12 mx-auto mb-2" />
            <p>Nenhum alerta detectado</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`border rounded-lg p-3 ${
                alert.isMlDetection
                  ? 'border-red-200 bg-red-50'
                  : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {alert.isMlDetection ? (
                    <Brain className="h-4 w-4 text-red-600 flex-shrink-0" />
                  ) : (
                    <Shield className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {alert.alertType}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {alert.description}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    alert.riskScore >= 0.8
                      ? 'bg-red-200 text-red-900'
                      : alert.riskScore >= 0.5
                      ? 'bg-orange-200 text-orange-900'
                      : 'bg-yellow-200 text-yellow-900'
                  }`}>
                    {(alert.riskScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>{alert.userName} ({alert.userId})</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(alert.createdAt)}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  alert.isMlDetection
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {alert.isMlDetection ? 'ML' : 'Regra'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
