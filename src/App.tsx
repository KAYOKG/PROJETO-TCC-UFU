import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { ClientList } from './components/ClientList';
import { ContractManagement } from './components/ContractManagement';
import { ContractPreview } from './components/ContractPreview';
import { Layout } from './components/Layout';
import { SystemLogs } from './components/SystemLogs';
import { RiskDashboard } from './components/dashboard/RiskDashboard';
import { ClientForm } from './components/forms/ClientForm';
import { CompanyForm } from './components/forms/CompanyForm';
import { ContractForm } from './components/forms/ContractForm';
import { useLogStore } from './store/useLogStore';
import { Client, Company, Contract } from './types';

function AppContent() {
  const navigate = useNavigate();
  const [showClientForm, setShowClientForm] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const addLog = useLogStore((state) => state.addLog);
  const updateSession = useLogStore((state) => state.updateSession);

  useEffect(() => {
    updateSession({ loginAttempts: 1, startTime: new Date(), lastActivity: new Date() });
  }, []);

  const notify = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getUserInfo = () => ({
    userName: 'Admin',
    userId: 'admin-001',
    accessLevel: 'admin' as const,
    device: navigator.platform,
    browser: navigator.userAgent,
  });

  const handleClientSubmit = (clientData: Omit<Client, 'id'>) => {
    const newClient = { ...clientData, id: Math.random().toString(36).substr(2, 9) };
    setClients([...clients, newClient]);
    setShowClientForm(false);
    notify(`Cliente ${newClient.name} cadastrado com sucesso`);

    const { userName, userId, accessLevel, device, browser } = getUserInfo();
    addLog({
      userName, userId, accessLevel,
      action: 'Cadastro de Cliente',
      details: `Cliente ${newClient.name} cadastrado com sucesso`,
      origin: { module: 'Clientes', device, browser },
      result: 'success',
    });
  };

  const handleClientEdit = (updatedClient: Client) => {
    setClients(clients.map(client => client.id === updatedClient.id ? updatedClient : client));
    notify(`Cliente ${updatedClient.name} atualizado`);

    const { userName, userId, accessLevel, device, browser } = getUserInfo();
    addLog({
      userName, userId, accessLevel,
      action: 'Edição de Cliente',
      details: `Cliente ${updatedClient.name} atualizado`,
      origin: { module: 'Clientes', device, browser },
      result: 'success',
    });
  };

  const handleClientDelete = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setClients(clients.filter(c => c.id !== clientId));
    notify(`Cliente ${client?.name} removido`);

    const { userName, userId, accessLevel, device, browser } = getUserInfo();
    addLog({
      userName, userId, accessLevel,
      action: 'Exclusão de Cliente',
      details: `Cliente ${client?.name} removido`,
      origin: { module: 'Clientes', device, browser },
      result: 'success',
    });
  };

  const handleCompanySubmit = (companyData: Omit<Company, 'id'>) => {
    const isUpdate = !!company;
    const updatedCompany = company
      ? { ...companyData, id: company.id }
      : { ...companyData, id: Math.random().toString(36).substr(2, 9) };
    setCompany(updatedCompany);
    notify(`Empresa ${updatedCompany.name} ${isUpdate ? 'atualizada' : 'cadastrada'}`);

    const { userName, userId, accessLevel, device, browser } = getUserInfo();
    addLog({
      userName, userId, accessLevel,
      action: isUpdate ? 'Atualização de Empresa' : 'Cadastro de Empresa',
      details: `Empresa ${updatedCompany.name} ${isUpdate ? 'atualizada' : 'cadastrada'}`,
      origin: { module: 'Empresa', device, browser },
      result: 'success',
    });
  };

  const handleContractSubmit = (contractData: Omit<Contract, 'id' | 'status'>) => {
    const newContract = { ...contractData, id: Math.random().toString(36).substr(2, 9), status: 'pending' as const };
    setContracts([...contracts, newContract]);
    setSelectedContract(newContract);
    notify('Contrato criado com sucesso');

    const { userName, userId, accessLevel, device, browser } = getUserInfo();
    addLog({
      userName, userId, accessLevel,
      action: 'Criação de Contrato',
      details: `Contrato criado entre ${newContract.seller.name} e ${newContract.buyer.name}`,
      origin: { module: 'Contratos', device, browser },
      result: 'success',
    });
  };

  const handleContractStatusUpdate = (contractId: string, status: Contract['status']) => {
    setContracts(contracts.map(contract => {
      if (contract.id === contractId) {
        const { userName, userId, accessLevel, device, browser } = getUserInfo();
        addLog({
          userName, userId, accessLevel,
          action: 'Atualização de Status',
          details: `Status do contrato entre ${contract.seller.name} e ${contract.buyer.name} alterado para ${status}`,
          origin: { module: 'Gestão de Contratos', device, browser },
          result: 'success',
        });
        return { ...contract, status };
      }
      return contract;
    }));
  };

  const handleContractDelete = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    setContracts(contracts.filter(c => c.id !== contractId));
    notify('Contrato removido');

    const { userName, userId, accessLevel, device, browser } = getUserInfo();
    addLog({
      userName, userId, accessLevel,
      action: 'Exclusão de Contrato',
      details: `Contrato entre ${contract?.seller.name} e ${contract?.buyer.name} removido`,
      origin: { module: 'Gestão de Contratos', device, browser },
      result: 'success',
    });
  };

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            showClientForm ? (
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>Cadastrar Novo Cliente</Typography>
                  <ClientForm onSubmit={handleClientSubmit} clients={clients} />
                  <Button onClick={() => setShowClientForm(false)} sx={{ mt: 2 }}>Voltar para lista</Button>
                </CardContent>
              </Card>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5">Clientes</Typography>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowClientForm(true)}>
                    Novo Cliente
                  </Button>
                </Box>
                <ClientList clients={clients} onEdit={handleClientEdit} onDelete={handleClientDelete} />
              </Box>
            )
          }
        />
        <Route
          path="/company"
          element={
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {company ? 'Dados da Empresa' : 'Cadastrar Empresa'}
                </Typography>
                <CompanyForm company={company} onSubmit={handleCompanySubmit} />
              </CardContent>
            </Card>
          }
        />
        <Route
          path="/contracts"
          element={
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>Gerar Novo Contrato</Typography>
                {!company ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <BusinessIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography color="text.secondary">
                      Por favor, cadastre a empresa primeiro para gerar contratos
                    </Typography>
                  </Box>
                ) : clients.length < 2 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <LocalCafeIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography color="text.secondary">
                      Por favor, cadastre pelo menos dois clientes para gerar um contrato
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <ContractForm clients={clients} onSubmit={handleContractSubmit} />
                    {selectedContract && (
                      <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>Visualização do Contrato</Typography>
                        <ContractPreview
                          contract={selectedContract}
                          onConfirm={() => {
                            handleContractStatusUpdate(selectedContract.id, 'active');
                            navigate('/management');
                          }}
                        />
                      </Box>
                    )}
                    {contracts.length > 0 && !selectedContract && (
                      <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>Contratos Existentes</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {contracts.map((contract) => (
                            <Card
                              key={contract.id}
                              variant="outlined"
                              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                              onClick={() => setSelectedContract(contract)}
                            >
                              <CardContent>
                                <Typography fontWeight={600}>
                                  Contrato: {contract.seller.name} → {contract.buyer.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {contract.quantity} sacas - Entrega: {new Date(contract.date).toLocaleDateString()}
                                </Typography>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          }
        />
        <Route
          path="/management"
          element={
            <ContractManagement
              contracts={contracts}
              onStatusUpdate={handleContractStatusUpdate}
              onDelete={handleContractDelete}
            />
          }
        />
        <Route path="/logs" element={<SystemLogs />} />
        <Route path="/dashboard" element={<RiskDashboard />} />
      </Routes>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
