import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Client } from '../../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  mode: 'view' | 'edit';
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
}

export function ClientModal({ isOpen, onClose, client, mode, onEdit, onDelete }: ClientModalProps) {
  const [editedClient, setEditedClient] = useState<Client>(client);
  const [isEditing, setIsEditing] = useState(mode === 'edit');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit(editedClient);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${client.name}?`)) {
      onDelete(client.id);
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setEditedClient(prev => ({
        ...prev,
        [section]: { ...(prev as Record<string, Record<string, unknown>>)[section], [field]: value },
      }));
    } else {
      setEditedClient(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isEditing ? 'Editar Cliente' : 'Detalhes do Cliente'}
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Nome" name="name" value={editedClient.name} onChange={handleInputChange} disabled={!isEditing} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="CPF" name="cpf" value={editedClient.cpf} onChange={handleInputChange} disabled={!isEditing} />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Informações Bancárias</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Nome do Banco" name="bankInfo.bankName" value={editedClient.bankInfo.bankName} onChange={handleInputChange} disabled={!isEditing} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth select label="Tipo de Conta" name="bankInfo.accountType" value={editedClient.bankInfo.accountType} onChange={handleInputChange} disabled={!isEditing}>
                <MenuItem value="checking">Corrente</MenuItem>
                <MenuItem value="savings">Poupança</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Número da Conta" name="bankInfo.accountNumber" value={editedClient.bankInfo.accountNumber} onChange={handleInputChange} disabled={!isEditing} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Agência" name="bankInfo.branch" value={editedClient.bankInfo.branch} onChange={handleInputChange} disabled={!isEditing} />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Endereço do Armazém</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Rua" name="warehouseAddress.street" value={editedClient.warehouseAddress.street} onChange={handleInputChange} disabled={!isEditing} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Número" name="warehouseAddress.number" value={editedClient.warehouseAddress.number} onChange={handleInputChange} disabled={!isEditing} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Complemento" name="warehouseAddress.complement" value={editedClient.warehouseAddress.complement || ''} onChange={handleInputChange} disabled={!isEditing} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Cidade" name="warehouseAddress.city" value={editedClient.warehouseAddress.city} onChange={handleInputChange} disabled={!isEditing} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Estado" name="warehouseAddress.state" value={editedClient.warehouseAddress.state} onChange={handleInputChange} disabled={!isEditing} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="CEP" name="warehouseAddress.zipCode" value={editedClient.warehouseAddress.zipCode} onChange={handleInputChange} disabled={!isEditing} />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {isEditing ? (
            <>
              <Button onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />}>Salvar</Button>
            </>
          ) : (
            <>
              <Button startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>Editar</Button>
              <Button color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>Excluir</Button>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}
