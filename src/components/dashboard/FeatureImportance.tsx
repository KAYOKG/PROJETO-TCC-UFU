import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMLStore } from '../../store/useMLStore';
import { FEATURE_NAMES } from '../../types';
import { Layers } from 'lucide-react';

const FEATURE_LABELS: Record<string, string> = {
  hourOfDay: 'Hora do Dia',
  dayOfWeek: 'Dia da Semana',
  accessLevelEncoded: 'Nível de Acesso',
  actionTypeCreate: 'Ação: Criar',
  actionTypeRead: 'Ação: Ler',
  actionTypeUpdate: 'Ação: Atualizar',
  actionTypeDelete: 'Ação: Excluir',
  actionTypeLogin: 'Ação: Login',
  actionTypeConfig: 'Ação: Config',
  moduleClientes: 'Mod: Clientes',
  moduleEmpresa: 'Mod: Empresa',
  moduleContratos: 'Mod: Contratos',
  moduleGestao: 'Mod: Gestão',
  moduleSistema: 'Mod: Sistema',
  resultEncoded: 'Resultado',
  sessionDurationMinutes: 'Duração Sessão',
  actionFrequency: 'Freq. Ações',
  actionVariety: 'Variedade Ações',
  actionSequenceEntropy: 'Entropia Sequência',
  moduleAccessCount: 'Módulos Acessados',
  sensitiveDataAccessCount: 'Acesso Sensível',
  errorRate: 'Taxa de Erros',
  avgTimeBetweenActions: 'Tempo Médio entre Ações',
  burstScore: 'Score de Rajada',
  networkLatency: 'Latência de Rede',
  geoDistanceFromUsual: 'Distância Geo.',
  ipChangeFlag: 'Mudança de IP',
  loginAttempts: 'Tentativas Login',
  inactivitySeconds: 'Inatividade',
  isNewDevice: 'Novo Dispositivo',
};

export function FeatureImportance() {
  const predictions = useMLStore(state => state.predictions);

  const importanceData = useMemo(() => {
    if (predictions.length === 0) return [];

    const suspiciousPreds = predictions.filter(p => p.riskScore > 0.5);
    const normalPreds = predictions.filter(p => p.riskScore <= 0.5);

    if (suspiciousPreds.length === 0 || normalPreds.length === 0) return [];

    const avgSusp = FEATURE_NAMES.map((_, i) => {
      const sum = suspiciousPreds.reduce((acc, p) => acc + p.featureVector[i], 0);
      return sum / suspiciousPreds.length;
    });

    const avgNorm = FEATURE_NAMES.map((_, i) => {
      const sum = normalPreds.reduce((acc, p) => acc + p.featureVector[i], 0);
      return sum / normalPreds.length;
    });

    return FEATURE_NAMES.map((name, i) => ({
      feature: FEATURE_LABELS[name] || name,
      importance: Math.abs(avgSusp[i] - avgNorm[i]),
    }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 15);
  }, [predictions]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Layers className="h-5 w-5 text-emerald-500" />
        Importância das Features
      </h3>

      {importanceData.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Layers className="h-12 w-12 mx-auto mb-2" />
          <p>Necessário ter predições normais e suspeitas</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={importanceData} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 'auto']} fontSize={11} />
            <YAxis dataKey="feature" type="category" fontSize={11} width={120} />
            <Tooltip formatter={(value: number) => value.toFixed(4)} />
            <Bar dataKey="importance" name="Importância" fill="#10b981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
