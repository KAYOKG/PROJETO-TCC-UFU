import LayersIcon from '@mui/icons-material/Layers';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMLStore } from '../../store/useMLStore';
import { FEATURE_NAMES } from '../../types';

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

const BAR_COLORS = [
  '#1565c0', '#1976d2', '#1e88e5', '#2196f3', '#42a5f5',
  '#64b5f6', '#90caf9', '#a5d6a7', '#81c784', '#66bb6a',
  '#4caf50', '#43a047', '#388e3c', '#2e7d32', '#1b5e20',
];

export function FeatureImportance() {
  const predictions = useMLStore(state => state.predictions);
  const threshold = useMLStore(state => state.threshold);

  const importanceData = useMemo(() => {
    if (predictions.length === 0) return [];

    const suspiciousPreds = predictions.filter(p => p.riskScore >= threshold);
    const normalPreds = predictions.filter(p => p.riskScore < threshold);

    if (suspiciousPreds.length > 0 && normalPreds.length > 0) {
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
    }

    // Fallback: só uma classe (ex.: só suspeitos após simulação) — importância = desvio da média global 0.5
    const allPreds = predictions;
    const avgVec = FEATURE_NAMES.map((_, i) => {
      const sum = allPreds.reduce((acc, p) => acc + p.featureVector[i], 0);
      return sum / allPreds.length;
    });
    return FEATURE_NAMES.map((name, i) => ({
      feature: FEATURE_LABELS[name] || name,
      importance: Math.abs(avgVec[i] - 0.5),
    }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 15);
  }, [predictions, threshold]);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LayersIcon color="success" />
            Importância das Features
          </Typography>
          {importanceData.length > 0 && (
            <Chip label={`Top ${importanceData.length} features`} size="small" variant="outlined" color="success" />
          )}
        </Box>

        {importanceData.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            py: 6,
            color: 'text.disabled',
            border: '2px dashed',
            borderColor: 'grey.200',
            borderRadius: 3,
          }}>
            <LayersIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography>Dados aparecerão conforme ações forem realizadas</Typography>
            <Typography variant="caption">O gráfico usa o limiar de decisão para comparar predições suspeitas vs. normais</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={importanceData} layout="vertical" margin={{ left: 130, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
              <XAxis type="number" domain={[0, 'auto']} fontSize={11} />
              <YAxis dataKey="feature" type="category" fontSize={11} width={130} />
              <Tooltip
                formatter={(value: number) => value.toFixed(4)}
                contentStyle={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
              />
              <Bar dataKey="importance" name="Importância" radius={[0, 4, 4, 0]} barSize={18}>
                {importanceData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
