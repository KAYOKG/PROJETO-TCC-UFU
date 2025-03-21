import React from 'react';
import { useLogStore } from '../store/useLogStore';
import { Clock, User, Target, Info, Monitor, CheckCircle, XCircle, Shield, Globe, Wifi, Timer, MousePointer, Settings } from 'lucide-react';

export function SystemLogs() {
  const logs = useLogStore((state) => state.logs);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const formatDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getInteractionIcon = (type?: string) => {
    switch (type) {
      case 'click':
        return <MousePointer className="h-4 w-4 text-blue-500" />;
      case 'configuration':
        return <Settings className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Logs do Sistema</h2>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Data e Hora</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>Usuário</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>Nível de Acesso</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>Ação</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Info className="h-4 w-4" />
                    <span>Detalhes</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Monitor className="h-4 w-4" />
                    <span>Origem</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Globe className="h-4 w-4" />
                    <span>Localização</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Wifi className="h-4 w-4" />
                    <span>Rede</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Timer className="h-4 w-4" />
                    <span>Sessão</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resultado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                    Nenhum log registrado
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                      <div className="text-sm text-gray-500">{log.userId}</div>
                      <div className="text-xs text-gray-400">
                        IP: {log.origin?.ipAddress || 'Não disponível'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.accessLevel === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : log.accessLevel === 'user'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {log.accessLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        {getInteractionIcon(log.interactionType)}
                        <span>{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-md break-words">
                        {log.details}
                        {log.elementInfo && (
                          <div className="text-xs text-gray-500 mt-1">
                            {log.elementInfo.id && <div>ID: {log.elementInfo.id}</div>}
                            {log.elementInfo.type && <div>Tipo: {log.elementInfo.type}</div>}
                            {log.elementInfo.text && <div>Texto: {log.elementInfo.text}</div>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.origin?.module || 'N/A'}</div>
                      <div className="text-sm text-gray-500">
                        {log.origin?.device || 'N/A'} - {log.origin?.browser || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.origin?.geolocation ? (
                        <>
                          <div className="text-gray-900">
                            Lat: {log.origin.geolocation.latitude.toFixed(6)}
                          </div>
                          <div className="text-gray-900">
                            Long: {log.origin.geolocation.longitude.toFixed(6)}
                          </div>
                          <div className="text-gray-500">
                            {log.origin.geolocation.city || 'Cidade não disponível'}
                          </div>
                          <div className="text-gray-500">
                            {log.origin.geolocation.state || 'Estado não disponível'}
                          </div>
                          <div className="text-gray-500">
                            {log.origin.geolocation.country || 'País não disponível'}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-500">Localização não disponível</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.origin?.network ? (
                        <>
                          <div className="text-gray-900">{log.origin.network.type}</div>
                          <div className="text-gray-500">
                            {log.origin.network.speed}
                            {log.origin.network.latency > 0 && ` - ${log.origin.network.latency}ms`}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-500">Não disponível</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.session ? (
                        <>
                          <div className="text-gray-900">
                            Duração: {formatDuration(log.session.startTime, log.timestamp)}
                          </div>
                          <div className="text-gray-500">
                            Tentativas: {log.session.loginAttempts}
                          </div>
                          {log.session.inactivityTime && log.session.inactivityTime > 0 && (
                            <div className="text-xs text-gray-400">
                              Inativo: {Math.floor(log.session.inactivityTime / 1000)}s
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500">Não disponível</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.result === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.result === 'success' ? (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1" />
                        )}
                        {log.result === 'success' ? 'Sucesso' : 'Erro'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}