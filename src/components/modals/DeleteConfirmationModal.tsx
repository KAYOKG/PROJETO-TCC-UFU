import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName: string;
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, clientName }: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="error" />
        Confirmar Exclusão
      </DialogTitle>
      <DialogContent>
        <Typography>
          Tem certeza que deseja excluir <Box component="span" fontWeight={600}>{clientName}</Box>?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">Não</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => { onConfirm(); onClose(); }}
        >
          Sim, Excluir
        </Button>
      </DialogActions>
    </Dialog>
  );
}
