import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
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
    <GridToolbarContainer sx={{ p: 1.5, gap: 1 }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarQuickFilter sx={{ minWidth: 250 }} />
    </GridToolbarContainer>
  );
}

const columns: GridColDef[] = [
  {
    field: 'expand',
    headerName: '',
    width: 50,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: () => <ExpandMoreIcon fontSize="small" color="action" />,
  },
  {
    field: 'timestamp',
    headerName: 'Data/Hora',
    width: 170,
    type: 'dateTime',
    valueGetter: (value: Date | string) => (value instanceof Date ? value : new Date(value)),
    valueFormatter: (value: Date) => formatDate(value),
  },
  {
    field: 'userName',
    headerName: 'Usuário',
    width: 150,
    renderCell: (params) => (
      <Box>
        <Typography variant="body2" fontWeight={500}>{params.row.userName}</Typography>
        <Typography variant="caption" color="text.secondary">{params.row.userId}</Typography>
      </Box>
    ),
  },
  {
    field: 'accessLevel',
    headerName: 'Nível de Acesso',
    width: 140,
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
    width: 200,
  },
  {
    field: 'details',
    headerName: 'Detalhes',
    flex: 1,
    minWidth: 200,
  },
  {
    field: 'module',
    headerName: 'Módulo',
    width: 140,
    valueGetter: (_value: unknown, row: SystemLog) => row.origin?.module || 'N/A',
  },
  {
    field: 'deviceBrowser',
    headerName: 'Dispositivo',
    width: 140,
    valueGetter: (_value: unknown, row: SystemLog) => row.origin?.device || 'N/A',
  },
  {
    field: 'ipLocation',
    headerName: 'IP/Localização',
    width: 160,
    valueGetter: (_value: unknown, row: SystemLog) => {
      const ip = row.origin?.ipAddress || '';
      const city = row.origin?.geolocation?.city || '';
      return city ? `${ip} (${city})` : ip || 'N/A';
    },
  },
  {
    field: 'network',
    headerName: 'Rede',
    width: 130,
    valueGetter: (_value: unknown, row: SystemLog) => row.origin?.network?.type || 'N/A',
  },
  {
    field: 'sessionInfo',
    headerName: 'Sessão',
    width: 140,
    valueGetter: (_value: unknown, row: SystemLog) => {
      if (!row.session) return 'N/A';
      return formatDuration(row.session.startTime, row.timestamp);
    },
  },
  {
    field: 'result',
    headerName: 'Resultado',
    width: 120,
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

function LogDetailPanel({ log, onClose }: { log: SystemLog; onClose: () => void }) {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Paper variant="outlined" sx={{ p: 2 }}>
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
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Detalhes do Log</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <Grid container spacing={2}>
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
              <Info label="IP" value={log.origin?.ipAddress} />
              {log.session && (
                <>
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
            <Section title="Origem & Rede">
              <Info label="Módulo" value={log.origin?.module} />
              <Info label="Dispositivo" value={log.origin?.device} />
              <Info label="Browser" value={log.origin?.browser} />
              {log.origin?.network && (
                <>
                  <Info label="Tipo de Rede" value={log.origin.network.type} />
                  <Info label="Velocidade" value={log.origin.network.speed} />
                  {log.origin.network.latency > 0 && (
                    <Info label="Latência" value={`${log.origin.network.latency}ms`} />
                  )}
                </>
              )}
              {log.origin?.geolocation && (
                <>
                  <Info label="Latitude" value={log.origin.geolocation.latitude.toFixed(6)} />
                  <Info label="Longitude" value={log.origin.geolocation.longitude.toFixed(6)} />
                  <Info label="Cidade" value={log.origin.geolocation.city} />
                  <Info label="Estado" value={log.origin.geolocation.state} />
                  <Info label="País" value={log.origin.geolocation.country} />
                </>
              )}
            </Section>
          </Grid>

          {log.elementInfo && (
            <Grid size={{ xs: 12 }}>
              <Section title="Elemento Interagido">
                {log.elementInfo.id && <Info label="ID" value={log.elementInfo.id} />}
                {log.elementInfo.type && <Info label="Tipo" value={log.elementInfo.type} />}
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

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Logs do Sistema</Typography>

      <Card>
        <Box sx={{ width: '100%' }}>
          <DataGrid
            rows={logs}
            columns={columns}
            getRowId={(row) => row.id}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: 'timestamp', sort: 'desc' }] },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            slots={{ toolbar: CustomToolbar }}
            slotProps={{
              toolbar: { showQuickFilter: true },
            }}
            onRowClick={(params) => {
              setSelectedLogId(prev => prev === params.id ? null : String(params.id));
            }}
            getRowHeight={() => 52}
            sx={{
              border: 'none',
              '& .MuiDataGrid-row': { cursor: 'pointer' },
              '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
              '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
            }}
            disableRowSelectionOnClick
            autoHeight
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

      <Collapse in={!!selectedLog}>
        {selectedLog && (
          <LogDetailPanel log={selectedLog} onClose={() => setSelectedLogId(null)} />
        )}
      </Collapse>
    </Box>
  );
}
