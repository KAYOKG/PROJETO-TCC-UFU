import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearSessionInvalidation } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useLogStore } from '../store/useLogStore';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const sessionEndedMessage = (location.state as { message?: string })?.message;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(username, password)) {
      const user = useAuthStore.getState().user;
      if (user) {
        useLogStore.getState().updateSession({ userName: user.userName, userId: user.userId });
        clearSessionInvalidation(user.userId).catch(() => { });
      }
      navigate('/', { replace: true });
    } else {
      setError('Usuário ou senha inválidos.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper elevation={2} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" gutterBottom align="center">
          Sistema RAA
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Corretora de Café — Análise de Risco
        </Typography>
        {sessionEndedMessage && (
          <Typography color="error" variant="body2" align="center" sx={{ mb: 2 }}>
            {sessionEndedMessage}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            autoComplete="username"
            autoFocus
          />
          <TextField
            fullWidth
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            autoComplete="current-password"
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
          >
            Entrar
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
