import DescriptionIcon from '@mui/icons-material/Description';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Client, Contract } from '../../types';
import { AddressFields } from '../shared/AddressFields';

interface ContractFormProps {
  clients: Client[];
  onSubmit: (contract: Omit<Contract, 'id' | 'status'>) => void;
}

export function ContractForm({ clients, onSubmit }: ContractFormProps) {
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [selectedBuyer, setSelectedBuyer] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const seller = clients.find(c => c.id === selectedSeller);
    const buyer = clients.find(c => c.id === selectedBuyer);

    if (!seller || !buyer) return;

    const contract = {
      seller,
      buyer,
      deliveryAddress: {
        street: formData.get('street') as string,
        number: formData.get('number') as string,
        complement: formData.get('complement') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        country: formData.get('country') as string,
        zipCode: formData.get('zipCode') as string,
      },
      quantity: Number(formData.get('quantity')),
      price: Number(formData.get('price')),
      date: formData.get('date') as string,
    };

    onSubmit(contract);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Partes do Contrato</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth select label="Vendedor" required
                  value={selectedSeller}
                  onChange={(e) => setSelectedSeller(e.target.value)}
                >
                  <MenuItem value="" disabled>Selecione um vendedor</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth select label="Comprador" required
                  value={selectedBuyer}
                  onChange={(e) => setSelectedBuyer(e.target.value)}
                >
                  <MenuItem value="" disabled>Selecione um comprador</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Detalhes do Contrato</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Quantidade (sacas)" name="quantity" type="number" required slotProps={{ htmlInput: { min: 1 } }} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Preço por saca" name="price" type="number" required slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Data de Entrega" name="date" type="date" required slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Endereço de Entrega</Typography>
            <AddressFields />
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" startIcon={<DescriptionIcon />}>
            Gerar Contrato
          </Button>
        </Box>
      </Box>
    </form>
  );
}
