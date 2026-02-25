import SaveIcon from '@mui/icons-material/Save';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Client } from '../../types';

interface ClientFormProps {
  onSubmit: (client: Omit<Client, 'id'>) => void;
  clients: Client[];
}

export function ClientForm({ onSubmit, clients }: ClientFormProps) {
  const [cpfError, setCpfError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const cpf = formData.get('cpf') as string;

    const existingClient = clients.find(client => client.cpf === cpf);
    if (existingClient) {
      setCpfError('Já existe um cliente cadastrado com este CPF');
      return;
    }

    const client = {
      name: formData.get('name') as string,
      cpf,
      bankInfo: {
        bankName: formData.get('bankName') as string,
        accountNumber: formData.get('accountNumber') as string,
        branch: formData.get('branch') as string,
        accountType: formData.get('accountType') as 'checking' | 'savings',
      },
      warehouseAddress: {
        street: formData.get('street') as string,
        number: formData.get('number') as string,
        complement: formData.get('complement') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        country: 'Brasil',
        zipCode: formData.get('zipCode') as string,
      },
    };

    setCpfError(null);
    onSubmit(client);
    (e.target as HTMLFormElement).reset();
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cpf = e.target.value;
    const existingClient = clients.find(client => client.cpf === cpf);
    setCpfError(existingClient ? 'Já existe um cliente cadastrado com este CPF' : null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Informações Pessoais</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Nome" name="name" required />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth label="CPF" name="cpf" required
                  onChange={handleCpfChange}
                  error={!!cpfError}
                  helperText={cpfError}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Informações Bancárias</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Nome do Banco" name="bankName" required />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth select label="Tipo de Conta" name="accountType" required defaultValue="checking">
                  <MenuItem value="checking">Corrente</MenuItem>
                  <MenuItem value="savings">Poupança</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Número da Conta" name="accountNumber" required />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Agência" name="branch" required />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Endereço do Armazém</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Rua" name="street" required />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Número" name="number" required />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Complemento" name="complement" />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Cidade" name="city" required />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Estado" name="state" required />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="CEP" name="zipCode" required />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!!cpfError}
          >
            Salvar Cliente
          </Button>
        </Box>
      </Box>
    </form>
  );
}
