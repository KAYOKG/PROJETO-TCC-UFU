import DownloadIcon from '@mui/icons-material/Download';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { jsPDF } from 'jspdf';
import { Contract } from '../types';

interface ContractPreviewProps {
  contract: Contract;
  onConfirm: () => void;
}

export function ContractPreview({ contract, onConfirm }: ContractPreviewProps) {
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('CONTRATO DE COMPRA E VENDA DE CAFÉ', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text('1. PARTES', 20, 40);
    doc.text(`VENDEDOR: ${contract.seller.name}`, 20, 50);
    doc.text(`CPF: ${contract.seller.cpf}`, 20, 60);
    doc.text(`COMPRADOR: ${contract.buyer.name}`, 20, 70);
    doc.text(`CPF: ${contract.buyer.cpf}`, 20, 80);

    doc.text('2. OBJETO', 20, 100);
    doc.text(`${contract.quantity} sacas de café`, 20, 110);
    doc.text(`Valor unitário: ${formatCurrency(contract.price)}`, 20, 120);
    doc.text(`Total: ${formatCurrency(contract.quantity * contract.price)}`, 20, 130);

    doc.text('3. LOCAL DE ENTREGA', 20, 150);
    doc.text(`${contract.deliveryAddress.street}, ${contract.deliveryAddress.number}`, 20, 160);
    if (contract.deliveryAddress.complement) {
      doc.text(contract.deliveryAddress.complement, 20, 170);
    }
    doc.text(`${contract.deliveryAddress.city} - ${contract.deliveryAddress.state}`, 20, 180);
    doc.text(`CEP: ${contract.deliveryAddress.zipCode}`, 20, 190);

    doc.text('4. PRAZO DE ENTREGA', 20, 210);
    doc.text(`Data de entrega: ${formatDate(contract.date)}`, 20, 220);

    doc.save(`contrato-cafe-${contract.id}.pdf`);
  };

  return (
    <Box>
      <Card sx={{ maxWidth: 900, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" align="center" fontWeight={700} gutterBottom>
            CONTRATO DE COMPRA E VENDA DE CAFÉ
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>1. PARTES</Typography>
          <Typography><strong>VENDEDOR:</strong> {contract.seller.name}</Typography>
          <Typography variant="body2" gutterBottom>CPF: {contract.seller.cpf}</Typography>
          <Typography sx={{ mt: 1 }}><strong>COMPRADOR:</strong> {contract.buyer.name}</Typography>
          <Typography variant="body2">CPF: {contract.buyer.cpf}</Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>2. OBJETO</Typography>
          <Typography>
            O presente contrato tem por objeto a compra e venda de {contract.quantity} sacas de café,
            pelo valor unitário de {formatCurrency(contract.price)}, totalizando {formatCurrency(contract.quantity * contract.price)}.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>3. LOCAL DE ENTREGA</Typography>
          <Typography>{contract.deliveryAddress.street}, {contract.deliveryAddress.number}</Typography>
          {contract.deliveryAddress.complement && <Typography>{contract.deliveryAddress.complement}</Typography>}
          <Typography>{contract.deliveryAddress.city} - {contract.deliveryAddress.state}</Typography>
          <Typography>{contract.deliveryAddress.country}</Typography>
          <Typography>CEP: {contract.deliveryAddress.zipCode}</Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>4. PRAZO DE ENTREGA</Typography>
          <Typography>A entrega deverá ser realizada até {formatDate(contract.date)}.</Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>5. CONDIÇÕES DE PAGAMENTO</Typography>
          <Typography gutterBottom>O pagamento será realizado mediante depósito bancário nas seguintes contas:</Typography>
          <Box sx={{ ml: 2 }}>
            <Typography variant="body2"><strong>Dados bancários do vendedor:</strong></Typography>
            <Typography variant="body2">Banco: {contract.seller.bankInfo.bankName}</Typography>
            <Typography variant="body2">Agência: {contract.seller.bankInfo.branch}</Typography>
            <Typography variant="body2">Conta: {contract.seller.bankInfo.accountNumber}</Typography>
            <Typography variant="body2">Tipo: {contract.seller.bankInfo.accountType === 'checking' ? 'Corrente' : 'Poupança'}</Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography align="center" sx={{ mt: 4 }}>
            {contract.deliveryAddress.city}, {formatDate(new Date().toISOString())}
          </Typography>

          <Grid container spacing={4} sx={{ mt: 6 }}>
            <Grid size={{ xs: 6 }}>
              <Divider />
              <Typography align="center" sx={{ mt: 1 }}>{contract.seller.name}</Typography>
              <Typography align="center" variant="caption" color="text.secondary">Vendedor</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Divider />
              <Typography align="center" sx={{ mt: 1 }}>{contract.buyer.name}</Typography>
              <Typography align="center" variant="caption" color="text.secondary">Comprador</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<DownloadIcon />}
          onClick={() => { downloadPDF(); onConfirm(); }}
        >
          Confirmar e Baixar Contrato
        </Button>
      </Box>
    </Box>
  );
}
