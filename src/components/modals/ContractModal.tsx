import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Contract } from '../../types';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  mode: 'view' | 'edit';
  onStatusUpdate: (contractId: string, status: Contract['status']) => void;
}

export function ContractModal({ isOpen, onClose, contract, mode, onStatusUpdate }: ContractModalProps) {
  const [status, setStatus] = useState(contract.status);

  if (!isOpen) return null;

  const handleStatusChange = (newStatus: Contract['status']) => {
    setStatus(newStatus);
    onStatusUpdate(contract.id, newStatus);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {mode === 'edit' ? 'Editar Contrato' : 'Detalhes do Contrato'}
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>Status do Contrato</Typography>
        <TextField
          fullWidth select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as Contract['status'])}
          disabled={mode === 'view'}
          sx={{ mb: 3 }}
        >
          <MenuItem value="active">Em Progresso</MenuItem>
          <MenuItem value="completed">Concluído</MenuItem>
        </TextField>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>Partes</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" fontWeight={600}>Vendedor</Typography>
            <Typography variant="body2">{contract.seller.name}</Typography>
            <Typography variant="caption" color="text.secondary">CPF: {contract.seller.cpf}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" fontWeight={600}>Comprador</Typography>
            <Typography variant="body2">{contract.buyer.name}</Typography>
            <Typography variant="caption" color="text.secondary">CPF: {contract.buyer.cpf}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>Detalhes</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Quantidade</Typography>
            <Typography variant="body2">{contract.quantity} sacas</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Valor por Saca</Typography>
            <Typography variant="body2">{formatCurrency(contract.price)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Valor Total</Typography>
            <Typography variant="body2" fontWeight={600}>{formatCurrency(contract.quantity * contract.price)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Data de Entrega</Typography>
            <Typography variant="body2">{formatDate(contract.date)}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>Endereço de Entrega</Typography>
        <Typography variant="body2">{contract.deliveryAddress.street}, {contract.deliveryAddress.number}</Typography>
        {contract.deliveryAddress.complement && <Typography variant="body2">{contract.deliveryAddress.complement}</Typography>}
        <Typography variant="body2">{contract.deliveryAddress.city} - {contract.deliveryAddress.state}</Typography>
        <Typography variant="body2">CEP: {contract.deliveryAddress.zipCode}</Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
