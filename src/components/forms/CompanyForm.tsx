import SaveIcon from '@mui/icons-material/Save';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Company } from '../../types';

interface CompanyFormProps {
  company: Company | null;
  onSubmit: (company: Omit<Company, 'id'>) => void;
}

export function CompanyForm({ company, onSubmit }: CompanyFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const companyData = {
      name: formData.get('name') as string,
      cnpj: formData.get('cnpj') as string,
      bankInfo: {
        bankName: formData.get('bankName') as string,
        accountNumber: formData.get('accountNumber') as string,
        branch: formData.get('branch') as string,
        accountType: formData.get('accountType') as 'checking' | 'savings',
      },
      address: {
        street: formData.get('street') as string,
        number: formData.get('number') as string,
        complement: formData.get('complement') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        country: 'Brasil',
        zipCode: formData.get('zipCode') as string,
      },
    };

    onSubmit(companyData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Informações da Empresa</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Nome da Empresa" name="name" defaultValue={company?.name} required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="CNPJ" name="cnpj" defaultValue={company?.cnpj} required />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Informações Bancárias</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Nome do Banco" name="bankName" defaultValue={company?.bankInfo.bankName} required />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth select label="Tipo de Conta" name="accountType" defaultValue={company?.bankInfo.accountType || 'checking'} required>
                  <MenuItem value="checking">Corrente</MenuItem>
                  <MenuItem value="savings">Poupança</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Número da Conta" name="accountNumber" defaultValue={company?.bankInfo.accountNumber} required />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Agência" name="branch" defaultValue={company?.bankInfo.branch} required />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Endereço da Empresa</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Rua" name="street" defaultValue={company?.address.street} required />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Número" name="number" defaultValue={company?.address.number} required />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Complemento" name="complement" defaultValue={company?.address.complement} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Cidade" name="city" defaultValue={company?.address.city} required />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="Estado" name="state" defaultValue={company?.address.state} required />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth label="CEP" name="zipCode" defaultValue={company?.address.zipCode} required />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />}>
            {company ? 'Atualizar Empresa' : 'Cadastrar Empresa'}
          </Button>
        </Box>
      </Box>
    </form>
  );
}
