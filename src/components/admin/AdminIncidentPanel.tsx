import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DangerousIcon from '@mui/icons-material/Dangerous';
import PersonIcon from '@mui/icons-material/Person';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  DataGrid,
  type GridColDef,
} from '@mui/x-data-grid';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchLogs,
  getFeedbackList,
  getFeedbackStats,
  getIncidents,
  getUsersRiskLevels,
  resolveIncident,
  retrainModel,
  type FeedbackItem,
  type UserRiskLevel,
} from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import type { Incident } from '../../types';
import { FEATURE_NAMES } from '../../types';

const POLL_MS = 12_000;

function gaugeColor(score: number): 'success' | 'warning' | 'error' | 'info' {
  if (score < 0.3) return 'success';
  if (score < 0.5) return 'info';
  if (score < 0.7) return 'warning';
  return 'error';
}

function parseFeatureVector(vec: string | null): number[] {
  if (!vec) return [];
  try {
    const arr = JSON.parse(vec);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function topFeatures(incident: { feature_vector: string | null }, n: number): { name: string; value: number }[] {
  const vec = parseFeatureVector(incident.feature_vector);
  const withIndex = vec.map((value, i) => ({ i, value: Math.abs(value), raw: value }));
  withIndex.sort((a, b) => b.value - a.value);
  return withIndex.slice(0, n).map(({ i, raw }) => ({
    name: FEATURE_NAMES[i] ?? `f${i}`,
    value: raw,
  }));
}

export function AdminIncidentPanel() {
  const adminUserId = useAuthStore((s) => s.user?.userId) ?? 'admin';
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState<UserRiskLevel[]>([]);
  const [historyIncidents, setHistoryIncidents] = useState<Incident[]>([]);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [retrainResult, setRetrainResult] = useState<Record<string, unknown> | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [detailUser, setDetailUser] = useState<UserRiskLevel | null>(null);
  const [detailLogs, setDetailLogs] = useState<Array<Record<string, unknown>>>([]);
  const [detailIncidents, setDetailIncidents] = useState<Incident[]>([]);
  const [historyFilterUser, setHistoryFilterUser] = useState<string>('');
  const [historyFilterDecision, setHistoryFilterDecision] = useState<string>('');

  const loadRiskLevels = useCallback(async () => {
    try {
      const { users: u } = await getUsersRiskLevels();
      setUsers(u);
    } catch {
      // ignore
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const { incidents } = await getIncidents();
      setHistoryIncidents(incidents.filter((i) => i.status !== 'pending'));
    } catch {
      setSnackbar({ open: true, message: 'Erro ao carregar histórico.', severity: 'error' });
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    try {
      const [stats, list] = await Promise.all([getFeedbackStats(), getFeedbackList()]);
      setFeedbackCount(stats.count);
      setFeedbackList(list.feedbacks);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadRiskLevels();
    loadHistory();
    loadFeedback();
    const id = setInterval(() => {
      loadRiskLevels();
      if (tab === 2) loadFeedback();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [loadRiskLevels, loadHistory, loadFeedback, tab]);

  useEffect(() => {
    if (!detailUser) return;
    (async () => {
      try {
        const [logsRes, { incidents }] = await Promise.all([
          fetchLogs({ userId: detailUser.userId, limit: 30 }),
          getIncidents(),
        ]);
        setDetailLogs(logsRes.logs);
        setDetailIncidents(incidents.filter((i) => i.user_id === detailUser.userId));
      } catch {
        setDetailLogs([]);
        setDetailIncidents([]);
      }
    })();
  }, [detailUser]);

  const handleResolve = async (incidentId: number, decision: 'confirm_threat' | 'clear') => {
    setResolvingId(incidentId);
    try {
      await resolveIncident(incidentId, {
        decision,
        admin_notes: notes[incidentId],
        decided_by: adminUserId,
      });
      setNotes((prev) => {
        const next = { ...prev };
        delete next[incidentId];
        return next;
      });
      await loadRiskLevels();
      await loadHistory();
      await loadFeedback();
      setSnackbar({
        open: true,
        message: decision === 'clear' ? 'Confirmado legítimo. Suspensão removida.' : 'Ameaça confirmada. Sessão do usuário encerrada.',
        severity: 'success',
      });
    } catch {
      setSnackbar({ open: true, message: 'Erro ao resolver incidente.', severity: 'error' });
    } finally {
      setResolvingId(null);
    }
  };

  const handleRetrain = async () => {
    setRetrainLoading(true);
    setRetrainResult(null);
    try {
      const result = await retrainModel();
      setRetrainResult(result as Record<string, unknown>);
      await loadFeedback();
      setSnackbar({ open: true, message: 'Modelo re-treinado com sucesso.', severity: 'success' });
    } catch (e) {
      setSnackbar({
        open: true,
        message: e instanceof Error ? e.message : 'Erro ao re-treinar.',
        severity: 'error',
      });
    } finally {
      setRetrainLoading(false);
    }
  };

  const filteredHistory = historyIncidents.filter((inc) => {
    if (historyFilterUser && inc.user_id !== historyFilterUser) return false;
    if (historyFilterDecision === 'threat' && inc.status !== 'confirmed_threat') return false;
    if (historyFilterDecision === 'legit' && inc.status !== 'cleared') return false;
    return true;
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Gestão de Incidentes
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Usuários" />
        <Tab label="Histórico de Incidentes" />
        <Tab label="Modelo ML" />
      </Tabs>

      {/* Aba 1 — Usuários */}
      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {users.length === 0 && (
            <Typography color="text.secondary">Nenhum usuário comum encontrado.</Typography>
          )}
          {users.map((u) => (
            <Card
              key={u.userId}
              variant="outlined"
              sx={{
                borderLeft: 4,
                borderLeftColor:
                  u.status === 'suspended' ? 'error.main' : u.status === 'observation' ? 'warning.main' : 'success.main',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                  <Avatar sx={{ bgcolor: u.status === 'suspended' ? 'error.main' : 'primary.main' }}>
                    <PersonIcon />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={600}>{u.userName}</Typography>
                    <Typography variant="body2" color="text.secondary">{u.userId}</Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={
                      u.status === 'suspended'
                        ? 'Suspenso'
                        : u.status === 'observation'
                          ? 'Em observação'
                          : 'Ativo'
                    }
                    color={
                      u.status === 'suspended' ? 'error' : u.status === 'observation' ? 'warning' : 'success'
                    }
                  />
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">Nível de ameaça</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, u.currentRiskScore * 100)}
                    color={gaugeColor(u.currentRiskScore)}
                    sx={{ height: 10, borderRadius: 1, mt: 0.5 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {(u.currentRiskScore * 100).toFixed(0)}% · Incidentes: {u.totalIncidents}
                  </Typography>
                </Box>

                {u.lastAction && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Última ação: {new Date(u.lastAction.timestamp).toLocaleString()} — {u.lastAction.description}
                  </Typography>
                )}

                {u.status === 'active' && (
                  <Button
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => setDetailUser(u)}
                  >
                    Ver histórico e ações
                  </Button>
                )}

                {u.status === 'suspended' && u.activeBlock?.incident && (() => {
                  const inc = u.activeBlock.incident as Incident;
                  const isPending = inc.status === 'pending';
                  return (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="subtitle2">Motivo da suspensão</Typography>
                      <Typography variant="body2">
                        {inc.action} — Score:{(Number(inc.ml_prediction) * 100).toFixed(0)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(inc.created_at).toLocaleString()}
                        {u.activeBlock.blockedUntil &&
                          ` · Timeout: ${new Date(u.activeBlock.blockedUntil).toLocaleTimeString()}`}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Top features: {topFeatures(inc, 5)
                          .map((f) => `${f.name}=${f.value.toFixed(2)}`)
                          .join(', ')}
                      </Typography>
                      {!isPending ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          {inc.status === 'confirmed_threat'
                            ? 'Incidente já resolvido (ameaça confirmada). Usuário permanece suspenso.'
                            : 'Incidente já resolvido (liberado como legítimo).'}
                        </Typography>
                      ) : (
                        <>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Notas (opcional)"
                            value={notes[u.activeBlock.incidentId] ?? ''}
                            onChange={(e) =>
                              setNotes((prev) => ({ ...prev, [u.activeBlock!.incidentId]: e.target.value }))
                            }
                            sx={{ mt: 2 }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button
                              variant="contained"
                              color="error"
                              startIcon={<DangerousIcon />}
                              onClick={() => handleResolve(u.activeBlock!.incidentId, 'confirm_threat')}
                              disabled={resolvingId === u.activeBlock!.incidentId}
                            >
                              Confirmar Ameaça
                            </Button>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleResolve(u.activeBlock!.incidentId, 'clear')}
                              disabled={resolvingId === u.activeBlock!.incidentId}
                            >
                              Confirmar Legítimo
                            </Button>
                          </Box>
                        </>
                      )}
                    </Box>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Aba 2 — Histórico */}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Usuário"
              value={historyFilterUser}
              onChange={(e) => setHistoryFilterUser(e.target.value)}
              sx={{ minWidth: 120 }}
            />
            <TextField
              size="small"
              select
              label="Decisão"
              value={historyFilterDecision}
              onChange={(e) => setHistoryFilterDecision(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ minWidth: 140 }}
            >
              <option value="">Todas</option>
              <option value="threat">Ameaça</option>
              <option value="legit">Legítimo</option>
            </TextField>
          </Box>
          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={filteredHistory.map((inc) => ({
                id: inc.id,
                date: new Date(inc.created_at).toLocaleString(),
                user: inc.user_name,
                action: inc.action,
                score: (inc.ml_prediction * 100).toFixed(0) + '%',
                decision: inc.status === 'confirmed_threat' ? 'Ameaça' : 'Legítimo',
                admin: inc.admin_decision ?? '-',
                notes: inc.admin_notes ?? '-',
              }))}
              columns={[
                { field: 'date', headerName: 'Data', width: 160 },
                { field: 'user', headerName: 'Usuário', width: 120 },
                { field: 'action', headerName: 'Ação', flex: 1, minWidth: 150 },
                { field: 'score', headerName: 'Score', width: 80 },
                { field: 'decision', headerName: 'Decisão', width: 100 },
                { field: 'admin', headerName: 'Admin', width: 120 },
                { field: 'notes', headerName: 'Notas', flex: 1, minWidth: 120 },
              ] as GridColDef[]}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              disableRowSelectionOnClick
            />
          </Box>
        </Box>
      )}

      {/* Aba 3 — Modelo ML */}
      {tab === 2 && (
        <Card variant="outlined">
          <CardContent>
            <Typography gutterBottom>
              Feedbacks para re-treinamento: <strong>{feedbackCount}</strong>
            </Typography>
            <Button
              variant="contained"
              onClick={handleRetrain}
              disabled={feedbackCount < 20 || retrainLoading}
              startIcon={retrainLoading ? <CircularProgress size={20} /> : null}
            >
              {retrainLoading ? 'Re-treinando...' : 'Re-treinar Modelo com Feedback'}
            </Button>
            {feedbackCount < 20 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Necessário pelo menos 20 feedbacks para re-treinar.
              </Typography>
            )}
            {retrainResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Última execução</Typography>
                <pre style={{ fontSize: 12, overflow: 'auto', maxHeight: 180 }}>{JSON.stringify(retrainResult, null, 2)}</pre>
              </Box>
            )}
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Últimas decisões de feedback (o que o modelo vai aprender)
            </Typography>
            <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1, maxHeight: 280, overflow: 'auto' }}>
              {feedbackList.length === 0 && (
                <ListItem><ListItemText primary="Nenhum feedback ainda." /></ListItem>
              )}
              {feedbackList.map((f) => (
                <ListItem key={f.id}>
                  <ListItemText
                    primary={`${f.userName} — ${f.action}`}
                    secondary={`${f.label === 1 ? 'Ameaça' : 'Legítimo'} · ${new Date(f.decidedAt).toLocaleString()} (${f.decidedBy})`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Drawer usuário ativo */}
      <Drawer
        anchor="right"
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{detailUser?.userName ?? ''}</Typography>
            <IconButton onClick={() => setDetailUser(null)} size="small">×</IconButton>
          </Box>
          <Typography variant="subtitle2" color="primary" gutterBottom>Ações recentes</Typography>
          <List dense sx={{ maxHeight: 240, overflow: 'auto', mb: 2 }}>
            {detailLogs.length === 0 && <ListItem><ListItemText primary="Nenhuma ação." /></ListItem>}
            {detailLogs.slice(0, 30).map((log, i) => (
              <ListItem key={i}>
                <ListItemText
                  primary={String(log.action ?? '-')}
                  secondary={log.timestamp ? new Date(String(log.timestamp)).toLocaleString() : ''}
                />
              </ListItem>
            ))}
          </List>
          <Typography variant="subtitle2" color="primary" gutterBottom>Incidentes passados</Typography>
          <List dense>
            {detailIncidents.filter((i) => i.status !== 'pending').length === 0 && (
              <ListItem><ListItemText primary="Nenhum incidente." /></ListItem>
            )}
            {detailIncidents
              .filter((i) => i.status !== 'pending')
              .map((inc) => (
                <ListItem key={inc.id}>
                  <ListItemText
                    primary={inc.action}
                    secondary={`${inc.status === 'confirmed_threat' ? 'Ameaça' : 'Legítimo'} · ${new Date(inc.created_at).toLocaleString()}`}
                  />
                </ListItem>
              ))}
          </List>
        </Box>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
