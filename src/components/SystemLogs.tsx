import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {
  DataGrid,
  GridColDef,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { useLogStore } from '../store/useLogStore';
import { SystemLog } from '../types';

const ACCESS_LEVEL_COLORS: Record<string, 'error' | 'primary' | 'default' | 'secondary'> = {
  admin: 'error',
  user: 'primary',
  guest: 'default',
  system: 'secondary',
};

const MAX_CELL_CHARS = 60;

function truncate(str: string | undefined, max = MAX_CELL_CHARS) {
  if (!str) return '—';
  if (str.length <= max) return str;
  return `${str.slice(0, max)}…`;
}

function formatIpDisplay(origin: SystemLog['origin']) {
  const v4 = origin?.ipv4Address || origin?.ipAddress;
  const v6 = origin?.ipv6Address;
  const parts: string[] = [];
  if (v4) parts.push(`IPv4: ${v4}`);
  if (v6) parts.push(`IPv6: ${v6}`);
  return parts.length ? parts.join(' | ') : 'N/A';
}

function formatLocationDisplay(origin: SystemLog['origin']) {
  const g = origin?.geolocation;
  if (!g) return null;
  const parts: string[] = [];
  if (g.city) parts.push(g.city);
  if (g.state) parts.push(g.state);
  if (g.country) parts.push(g.country);
  if (parts.length) return parts.join(', ');
  if (g.latitude != null && g.longitude != null) {
    return `${g.latitude.toFixed(4)}°, ${g.longitude.toFixed(4)}°`;
  }
  return null;
}

function formatDate(date: Date | string) {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(d);
}

function formatDuration(start: Date | string, end: Date | string) {
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  const diff = e.getTime() - s.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 1.5, gap: 1, flexWrap: 'wrap' }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
      <Box sx={{ flexGrow: 1, minWidth: 120 }} />
      <GridToolbarQuickFilter
        sx={{ minWidth: 220 }}
        placeholder="Buscar em todos os campos…"
      />
    </GridToolbarContainer>
  );
}

function getColumns(selectedLogId: string | null): GridColDef[] {
  return [
    {
      field: 'expand',
      headerName: '',
      width: 48,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const isExpanded = selectedLogId === params.row.id;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isExpanded ? (
              <ExpandLessIcon fontSize="small" color="primary" />
            ) : (
              <ExpandMoreIcon fontSize="small" color="action" />
            )}
          </Box>
        );
      },
    },
    {
      field: 'timestamp',
      headerName: 'Data/Hora',
      width: 155,
      type: 'dateTime',
      valueGetter: (value: Date | string) => (value instanceof Date ? value : new Date(value)),
      valueFormatter: (value: Date) => formatDate(value),
    },
    {
      field: 'userName',
      headerName: 'Usuário',
      width: 160,
      renderCell: (params) => (
        <Tooltip title={`${params.row.userName} (${params.row.userId})`}>
          <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ lineHeight: 1.2 }}>
              {params.row.userName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1.2, fontSize: '0.7rem' }}>
              ID: {params.row.userId}
            </Typography>
          </Box>
        </Tooltip>
      ),
    },
    {
      field: 'accessLevel',
      headerName: 'Nível',
      width: 95,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={ACCESS_LEVEL_COLORS[params.value as string] || 'default'}
          variant="filled"
        />
      ),
    },
    {
      field: 'action',
      headerName: 'Ação',
      width: 180,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <Typography variant="body2" noWrap sx={{ maxWidth: '100%' }}>
            {truncate(params.value, 35)}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'details',
      headerName: 'Detalhes',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <Typography variant="body2" noWrap sx={{ maxWidth: '100%' }}>
            {truncate(params.value, 50)}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'module',
      headerName: 'Módulo',
      width: 120,
      valueGetter: (_value: unknown, row: SystemLog) => row.origin?.module || 'N/A',
      renderCell: (params) => (
        <Typography variant="body2" noWrap title={params.value as string}>
          {truncate(params.value as string, 18)}
        </Typography>
      ),
    },
    {
      field: 'deviceBrowser',
      headerName: 'Dispositivo',
      width: 120,
      valueGetter: (_value: unknown, row: SystemLog) => row.origin?.device || 'N/A',
      renderCell: (params) => (
        <Typography variant="body2" noWrap title={params.value as string}>
          {truncate(params.value as string, 18)}
        </Typography>
      ),
    },
    {
      field: 'ipLocation',
      headerName: 'IP / Localização',
      width: 220,
      valueGetter: (_value: unknown, row: SystemLog) => {
        const ipStr = formatIpDisplay(row.origin);
        const locStr = formatLocationDisplay(row.origin);
        return locStr ? `${ipStr} — ${locStr}` : ipStr;
      },
      renderCell: (params) => (
        <Tooltip title={params.value as string}>
          <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', lineHeight: 1.2 }} noWrap>
              {formatIpDisplay(params.row.origin)}
            </Typography>
            {formatLocationDisplay(params.row.origin) && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
                {formatLocationDisplay(params.row.origin)}
              </Typography>
            )}
          </Box>
        </Tooltip>
      ),
    },
    {
      field: 'network',
      headerName: 'Rede',
      width: 100,
      valueGetter: (_value: unknown, row: SystemLog) => row.origin?.network?.type || 'N/A',
    },
    {
      field: 'sessionInfo',
      headerName: 'Sessão',
      width: 90,
      valueGetter: (_value: unknown, row: SystemLog) => {
        if (!row.session) return 'N/A';
        return formatDuration(row.session.startTime, row.timestamp);
      },
    },
    {
      field: 'result',
      headerName: 'Resultado',
      width: 110,
      renderCell: (params) => {
        const ok = params.value === 'success';
        return (
          <Chip
            icon={ok ? <CheckCircleIcon /> : <ErrorIcon />}
            label={ok ? 'Sucesso' : 'Erro'}
            size="small"
            color={ok ? 'success' : 'error'}
            variant="filled"
          />
        );
      },
    },
  ];
}

function LogDetailPanel({ log, onClose }: { log: SystemLog; onClose: () => void }) {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>{title}</Typography>
      {children}
    </Paper>
  );

  const Info = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <Box sx={{ mb: 0.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value ?? 'N/A'}</Typography>
    </Box>
  );

  return (
    <Card variant="outlined" sx={{ mt: 1 }}>
      <CardContent sx={{ py: 1.5, px: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Detalhes do Log</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Section title="Informações Gerais">
              <Info label="ID" value={log.id} />
              <Info label="Data/Hora" value={formatDate(log.timestamp)} />
              <Info label="Ação" value={log.action} />
              <Info label="Detalhes" value={log.details} />
              <Info label="Resultado" value={log.result === 'success' ? 'Sucesso' : 'Erro'} />
              {log.interactionType && <Info label="Tipo de Interação" value={log.interactionType} />}
            </Section>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Section title="Usuário & Sessão">
              <Info label="Nome" value={log.userName} />
              <Info label="ID" value={log.userId} />
              <Info label="Nível de Acesso" value={log.accessLevel} />
              {log.session && (
                <>
                  <Info label="Início da Sessão" value={formatDate(log.session.startTime)} />
                  <Info label="Última Atividade" value={formatDate(log.session.lastActivity)} />
                  <Info label="Duração da Sessão" value={formatDuration(log.session.startTime, log.timestamp)} />
                  <Info label="Tentativas de Login" value={log.session.loginAttempts} />
                  {(log.session.inactivityTime ?? 0) > 0 && (
                    <Info label="Tempo Inativo" value={`${Math.floor((log.session.inactivityTime ?? 0) / 1000)}s`} />
                  )}
                </>
              )}
            </Section>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Section title="Endereço IP">
              <Info
                label="IPv4"
                value={log.origin?.ipv4Address || log.origin?.ipAddress || undefined}
              />
              <Info
                label="IPv6"
                value={log.origin?.ipv6Address}
              />
            </Section>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Section title="Origem & Rede">
              <Info label="Módulo" value={log.origin?.module} />
              <Info label="Dispositivo" value={log.origin?.device} />
              <Info label="Navegador" value={log.origin?.browser} />
              {log.origin?.network && (
                <>
                  <Info label="Tipo de Rede" value={log.origin.network.type} />
                  <Info label="Velocidade" value={log.origin.network.speed} />
                  {(log.origin.network.latency ?? 0) > 0 && (
                    <Info label="Latência" value={`${log.origin.network.latency}ms`} />
                  )}
                </>
              )}
            </Section>
          </Grid>

          {(log.origin?.geolocation?.latitude != null || log.origin?.geolocation?.longitude != null) && (
            <Grid size={{ xs: 12 }}>
              <Section title="Localização Detalhada">
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Info label="Cidade" value={log.origin.geolocation?.city} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Info label="Estado" value={log.origin.geolocation?.state} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Info label="País" value={log.origin.geolocation?.country} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Info
                      label="Coordenadas"
                      value={
                        log.origin.geolocation?.latitude != null && log.origin.geolocation?.longitude != null
                          ? `${log.origin.geolocation.latitude.toFixed(6)}°, ${log.origin.geolocation.longitude.toFixed(6)}°`
                          : undefined
                      }
                    />
                  </Grid>
                </Grid>
                {([log.origin.geolocation?.city, log.origin.geolocation?.state, log.origin.geolocation?.country].filter(Boolean).length > 0) && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Endereço completo: {[
                      log.origin.geolocation?.city,
                      log.origin.geolocation?.state,
                      log.origin.geolocation?.country,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Typography>
                )}
                {(!log.origin.geolocation?.city && !log.origin.geolocation?.state && !log.origin.geolocation?.country) &&
                  log.origin.geolocation?.latitude != null &&
                  log.origin.geolocation?.longitude != null && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Cidade, estado e país serão preenchidos automaticamente quando a geolocalização for obtida.
                    </Typography>
                  )}
              </Section>
            </Grid>
          )}

          {log.elementInfo && (log.elementInfo.id || log.elementInfo.type || log.elementInfo.text || log.elementInfo.className) && (
            <Grid size={{ xs: 12 }}>
              <Section title="Elemento Interagido">
                {log.elementInfo.id && <Info label="ID do Elemento" value={log.elementInfo.id} />}
                {log.elementInfo.type && <Info label="Tipo" value={log.elementInfo.type} />}
                {log.elementInfo.className && <Info label="Classe CSS" value={log.elementInfo.className} />}
                {log.elementInfo.text && <Info label="Texto" value={log.elementInfo.text} />}
              </Section>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

export function SystemLogs() {
  const logs = useLogStore((state) => state.logs);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const selectedLog = useMemo(
    () => (selectedLogId ? logs.find(l => l.id === selectedLogId) ?? null : null),
    [logs, selectedLogId],
  );

  const columns = useMemo(() => getColumns(selectedLogId), [selectedLogId]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Typography variant="h5" sx={{ py: 2, px: 2, flexShrink: 0 }}>Logs do Sistema</Typography>

      <Card sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', m: 0, borderRadius: 0, boxShadow: 'none', borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ flex: 1, minHeight: 0, width: '100%', '& .MuiDataGrid-root': { height: '100% !important' } }}>
          <DataGrid
            rows={logs}
            columns={columns}
            getRowId={(row) => row.id}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: 'timestamp', sort: 'desc' }] },
              columns: {
                columnVisibilityModel: {
                  network: false,
                  sessionInfo: false,
                },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            slots={{ toolbar: CustomToolbar }}
            slotProps={{
              toolbar: { showQuickFilter: true },
            }}
            onRowClick={(params) => {
              setSelectedLogId(prev => prev === params.id ? null : String(params.id));
            }}
            getRowHeight={() => 56}
            getRowClassName={(params) =>
              params.id === selectedLogId ? 'row-expanded' : ''
            }
            sx={{
              border: 'none',
              '& .MuiDataGrid-row': { cursor: 'pointer' },
              '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
              '& .MuiDataGrid-row.row-expanded': {
                bgcolor: 'primary.light',
                borderLeft: '4px solid',
                borderColor: 'primary.main',
              },
              '& .MuiDataGrid-row.row-expanded:hover': {
                bgcolor: 'primary.light',
              },
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: 'grey.50',
                borderBottom: '2px solid',
                borderColor: 'divider',
              },
              '& .MuiDataGrid-row:nth-of-type(even):not(.row-expanded)': {
                bgcolor: 'grey.50',
              },
            }}
            disableRowSelectionOnClick
            localeText={{
              toolbarColumns: 'Colunas',
              toolbarFilters: 'Filtros',
              toolbarExport: 'Exportar',
              toolbarExportCSV: 'Exportar CSV',
              toolbarExportPrint: 'Imprimir',
              noRowsLabel: 'Nenhum log registrado',
              footerRowSelected: (count) => `${count} linha(s) selecionada(s)`,
              MuiTablePagination: {
                labelRowsPerPage: 'Linhas por página:',
              },
            }}
          />
        </Box>
      </Card>

      <Collapse in={!!selectedLog} sx={{ flexShrink: 0 }}>
        {selectedLog && (
          <Box
            sx={{
              p: 1.5,
              maxHeight: '45vh',
              overflowY: 'auto',
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            <LogDetailPanel log={selectedLog} onClose={() => setSelectedLogId(null)} />
          </Box>
        )}
      </Collapse>
    </Box>
  );
}
