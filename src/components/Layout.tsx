import ArticleIcon from '@mui/icons-material/Article';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SecurityIcon from '@mui/icons-material/Security';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getIncidents } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const DRAWER_WIDTH = 260;

const BASE_NAV_ITEMS = [
  { label: 'Clientes', path: '/', icon: PeopleIcon },
  { label: 'Empresa', path: '/company', icon: BusinessIcon },
  { label: 'Contratos', path: '/contracts', icon: DescriptionIcon },
  { label: 'Gestão de Contratos', path: '/management', icon: AssignmentIcon },
  { label: 'Logs do Sistema', path: '/logs', icon: ArticleIcon },
  { label: 'Dashboard ML', path: '/dashboard', icon: PsychologyIcon },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [newIncidentSnackbar, setNewIncidentSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const prevPendingRef = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === 'superadmin';

  const navItems = isSuperAdmin
    ? [...BASE_NAV_ITEMS, { label: 'Gestão de Incidentes', path: '/admin/incidents', icon: AssignmentIndIcon }]
    : BASE_NAV_ITEMS;

  const activeItem = navItems.find(item => item.path === location.pathname) || navItems[0];

  useEffect(() => {
    if (!isSuperAdmin) return;
    const load = async () => {
      try {
        const { incidents } = await getIncidents({ status: 'pending' });
        const count = incidents.length;
        if (count > prevPendingRef.current && prevPendingRef.current > 0) {
          const latest = incidents[0];
          setNewIncidentSnackbar({
            open: true,
            message: latest ? `Novo incidente: ${latest.user_name} — ${latest.action}` : 'Novo incidente pendente para revisão.',
          });
        }
        prevPendingRef.current = count;
        setPendingCount(count);
      } catch {
        // ignore
      }
    };
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [isSuperAdmin]);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5, px: 2.5 }}>
        <LocalCafeIcon color="primary" />
        <Box>
          <Typography variant="subtitle1" noWrap sx={{ lineHeight: 1.2 }}>
            Corretora de Café
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            Sistema RAA
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '& .MuiListItemIcon-root': { color: 'inherit' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
          <SecurityIcon fontSize="small" color="primary" />
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
            Análise Comportamental com Machine Learning
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Breadcrumbs sx={{ flexGrow: 1 }}>
            <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
              RAA
            </Link>
            <Typography color="text.primary" fontWeight={500}>{activeItem.label}</Typography>
          </Breadcrumbs>
          {isSuperAdmin && (
            <IconButton color="inherit" onClick={() => navigate('/admin/incidents')} aria-label="Incidentes pendentes">
              <Badge badgeContent={pendingCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        open
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <Box
          sx={{
            p: location.pathname === '/logs' ? 0 : { xs: 2, md: 3 },
            maxWidth: location.pathname === '/logs' ? 'none' : 1400,
            mx: location.pathname === '/logs' ? 0 : 'auto',
            height: location.pathname === '/logs' ? 'calc(100vh - 64px)' : 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Box>
      </Box>

      <Snackbar
        open={newIncidentSnackbar.open}
        autoHideDuration={5000}
        onClose={() => setNewIncidentSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity="warning"
          variant="filled"
          onClose={() => setNewIncidentSnackbar((s) => ({ ...s, open: false }))}
        >
          {newIncidentSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
