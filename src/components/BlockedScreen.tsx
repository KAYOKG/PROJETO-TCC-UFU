import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionStatus, getUserBlock } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useBlockStore } from '../store/useBlockStore';

const POLL_INTERVAL_MS = 10_000;
const SESSION_ENDED_MESSAGE =
  "Sua sessão foi encerrada pelo administrador devido a atividade suspeita.";

function Countdown({ blockedUntil }: { blockedUntil: string }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const end = new Date(blockedUntil).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((end - now) / 1000));
  });

  useEffect(() => {
    const end = new Date(blockedUntil).getTime();
    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((end - now) / 1000));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [blockedUntil]);

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return (
    <Typography variant="h6" sx={{ mt: 2 }}>
      Tempo restante: {m}:{String(s).padStart(2, '0')}
    </Typography>
  );
}

export function BlockedScreen() {
  const { blocked, blockedUntil, reason, status, clearBlocked } = useBlockStore();
  const userId = useAuthStore((s) => s.user?.userId);
  const role = useAuthStore((s) => s.user?.role);
  const navigate = useNavigate();
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!userId || !blocked) return;
    setPolling(true);
    const poll = async () => {
      try {
        const [blockData, sessionData] = await Promise.all([
          getUserBlock(userId),
          getSessionStatus(userId),
        ]);
        if (!sessionData.valid) {
          clearBlocked();
          useAuthStore.getState().logout();
          navigate("/login", { replace: true, state: { message: SESSION_ENDED_MESSAGE } });
          return;
        }
        if (!blockData.blocked) {
          clearBlocked();
        }
      } catch {
        // ignore
      }
    };
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
      setPolling(false);
    };
  }, [userId, blocked, clearBlocked, navigate]);

  // SuperAdmin nunca é suspenso: pode receber alertas, mas a tela de bloqueio não é exibida
  if (role === "superadmin") return null;
  if (!blocked) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        bgcolor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: 'white',
        p: 4,
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Sessão suspensa
      </Typography>
      {status === 'timeout' && (
        <>
          <Typography color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
            Sua sessão foi temporariamente suspensa por atividade incomum. Um administrador foi
            notificado. Aguarde a revisão.
          </Typography>
          {reason && (
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              {reason}
            </Typography>
          )}
          {blockedUntil && <Countdown blockedUntil={blockedUntil} />}
        </>
      )}
      {status === 'confirmed_threat' && (
        <Typography color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
          Seu acesso foi suspenso. Contate o administrador.
        </Typography>
      )}
    </Box>
  );
}
