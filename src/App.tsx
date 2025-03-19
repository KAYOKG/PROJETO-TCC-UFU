import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ClientForm } from './components/forms/ClientForm';
import { ClientList } from './components/ClientList';
import { CompanyForm } from './components/forms/CompanyForm';
import { ContractForm } from './components/forms/ContractForm';
import { ContractPreview } from './components/ContractPreview';
import { ContractManagement } from './components/ContractManagement';
import { SystemLogs } from './components/SystemLogs';
import { Client, Company, Contract } from './types';
import { Coffee, Users, Building2, FileText, Plus, Activity } from 'lucide-react';
import { useLogStore } from './store/useLogStore';

function App() {
  const [activeTab, setActiveTab] = useState<'clients' | 'companies' | 'contracts' | 'management' | 'logs'>('clients');
  const [showClientForm, setShowClientForm] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  const addLog = useLogStore((state) => state.addLog);
  const updateSession = useLogStore((state) => state.updateSession);

  useEffect(() => {
    // Simular tentativas de login
    updateSession({
      loginAttempts: 1,
      startTime: new Date(),
      lastActivity: new Date()
    });
  }, []);

  const getUserInfo = () => ({
    userName: 'Admin',
    userId: 'admin-001',
    accessLevel: 'admin' as const,
    device: navigator.platform,
    browser: navigator.userAgent,
  });

  const handleClientSubmit = (clientData: Omit<Client, 'id'>) => {
    const newClient = {
      ...clientData,
      id: Math.random().toString(36).substr(2, 9)
    };
    setClients([...clients, newClient]);
    setShowClientForm(false);

    const { userName, userId, accessLevel, device, browser } = getUserInfo();
    addLog({
      userName,
      userId,
      accessLevel,
      action: 'Cadastro de Cliente',
      details: `Cliente ${newClient.name} cadastrado com sucesso`,
      origin: {
        module: 'Clientes',
        device,
        browser,
      },
      result: 'success',
    });
  };

  const handleClientEdit = (updatedClient: Client) => {
    setClients(clients.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    ));

    const { userName, userId, accessLevel, device, browser } = getUserInfo();
    addLog({
      userName,
      userId,
      accessLevel,
      action: 'Edição de Cliente',
      details: `Cliente ${updatedClient.name} atualizado`,
      origin: {
        module: 'Clientes',
        device,
        browser,
      },
      result: 'success',
    });
  };

  const handleClientDelete = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setClients(clients.filter(client => client.id !== clientId));

    const { userName, userId, accessLevel, device, browser } = getUserInfo();
    addLog({
      userName,
      userId,
      accessLevel,
      action: 'Exclusão de Cliente',
      details: `Cliente ${client?.name} removido`,
      origin: {
        module: 'Clientes',
        device,
        browser,
      },
      result: 'success',
    });
  };

  const handleCompanySubmit = (companyData: Omit<Company, 'id'>) => {
    const updatedCompany = company ? {
      ...companyData,
      id: company.id
    } : {
      ...companyData,
      id: Math.random().toString(36).substr(2, 9)
    };
    setCompany(updatedCompany);

    const { userName, userId, accessLevel, device, browser } = getUserInfo();
    addLog({
      userName,
      userId,
      accessLevel,
      action: company ? 'Atualização de Empresa' : 'Cadastro de Empresa',
      details: `Empresa ${updatedCompany.name} ${company ? 'atualizada' : 'cadastrada'}`,
      origin: {
        module: 'Empresa',
        device,
        browser,
      },
      result: 'success',
    });
  };

  const handleContractSubmit = (contractData: Omit<Contract, 'id' | 'status'>) => {
    const newContract = {
      ...contractData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending' as const
    };
    setContracts([...contracts, newContract]);
    setSelectedContract(newContract);

    const { userName, userId, accessLevel, device, browser } = getUserInfo();
    addLog({
      userName,
      userId,
      accessLevel,
      action: 'Criação de Contrato',
      details: `Contrato criado entre ${newContract.seller.name} e ${newContract.buyer.name}`,
      origin: {
        module: 'Contratos',
        device,
        browser,
      },
      result: 'success',
    });
  };

  const handleContractStatusUpdate = (contractId: string, status: Contract['status']) => {
    setContracts(contracts.map(contract => {
      if (contract.id === contractId) {
        const { userName, userId, accessLevel, device, browser } = getUserInfo();
        addLog({
          userName,
          userId,
          accessLevel,
          action: 'Atualização de Status',
          details: `Status do contrato entre ${contract.seller.name} e ${contract.buyer.name} alterado para ${status}`,
          origin: {
            module: 'Gestão de Contratos',
            device,
            browser,
          },
          result: 'success',
        });
        return { ...contract, status };
      }
      return contract;
    }));
  };

  const handleContractDelete = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    setContracts(contracts.filter(contract => contract.id !== contractId));

    const { userName, userId, accessLevel, device, browser } = getUserInfo();
    addLog({
      userName,
      userId,
      accessLevel,
      action: 'Exclusão de Contrato',
      details: `Contrato entre ${contract?.seller.name} e ${contract?.buyer.name} removido`,
      origin: {
        module: 'Gestão de Contratos',
        device,
        browser,
      },
      result: 'success',
    });
  };

  return (
    <BrowserRouter>
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <nav className="flex space-x-4">
              <Link
                to="/"
                onClick={() => setActiveTab('clients')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                  activeTab === 'clients'
                    ? 'bg-brown-600 text-white'
                    : 'text-gray-600 hover:bg-brown-100'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Clientes</span>
              </Link>
              <Link
                to="/company"
                onClick={() => setActiveTab('companies')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                  activeTab === 'companies'
                    ? 'bg-brown-600 text-white'
                    : 'text-gray-600 hover:bg-brown-100'
                }`}
              >
                <Building2 className="h-5 w-5" />
                <span>Empresa</span>
              </Link>
              <Link
                to="/contracts"
                onClick={() => setActiveTab('contracts')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                  activeTab === 'contracts'
                    ? 'bg-brown-600 text-white'
                    : 'text-gray-600 hover:bg-brown-100'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>Contratos</span>
              </Link>
              <Link
                to="/management"
                onClick={() => setActiveTab('management')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                  activeTab === 'management'
                    ? 'bg-brown-600 text-white'
                    : 'text-gray-600 hover:bg-brown-100'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>Gestão de Contratos</span>
              </Link>
              <Link
                to="/logs"
                onClick={() => setActiveTab('logs')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                  activeTab === 'logs'
                    ? 'bg-brown-600 text-white'
                    : 'text-gray-600 hover:bg-brown-100'
                }`}
              >
                <Activity className="h-5 w-5" />
                <span>Logs do Sistema</span>
              </Link>
            </nav>
          </div>

          <Routes>
            <Route
              path="/"
              element={
                <div className="bg-white rounded-lg shadow-sm p-6">
                  {showClientForm ? (
                    <>
                      <h2 className="text-2xl font-semibold mb-6">Cadastrar Novo Cliente</h2>
                      <ClientForm onSubmit={handleClientSubmit} clients={clients} />
                      <div className="mt-4">
                        <button
                          onClick={() => setShowClientForm(false)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Voltar para lista
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold">Clientes</h2>
                        <button
                          onClick={() => setShowClientForm(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-brown-600 text-white rounded-md hover:bg-brown-700"
                        >
                          <Plus className="h-5 w-5" />
                          <span>Novo Cliente</span>
                        </button>
                      </div>
                      <ClientList
                        clients={clients}
                        onEdit={handleClientEdit}
                        onDelete={handleClientDelete}
                      />
                    </div>
                  )}
                </div>
              }
            />
            <Route
              path="/company"
              element={
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-semibold mb-6">
                    {company ? 'Dados da Empresa' : 'Cadastrar Empresa'}
                  </h2>
                  <CompanyForm company={company} onSubmit={handleCompanySubmit} />
                </div>
              }
            />
            <Route
              path="/contracts"
              element={
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-semibold mb-6">Gerar Novo Contrato</h2>
                  {!company ? (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 mx-auto text-brown-600 mb-4" />
                      <p className="text-lg text-gray-600">
                        Por favor, cadastre a empresa primeiro para gerar contratos
                      </p>
                    </div>
                  ) : clients.length < 2 ? (
                    <div className="text-center py-8">
                      <Coffee className="h-12 w-12 mx-auto text-brown-600 mb-4" />
                      <p className="text-lg text-gray-600">
                        Por favor, cadastre pelo menos dois clientes para gerar um contrato
                      </p>
                    </div>
                  ) : (
                    <>
                      <ContractForm clients={clients} onSubmit={handleContractSubmit} />
                      
                      {selectedContract && (
                        <div className="mt-8">
                          <h3 className="text-xl font-semibold mb-4">Visualização do Contrato</h3>
                          <ContractPreview
                            contract={selectedContract}
                            onConfirm={() => {
                              handleContractStatusUpdate(selectedContract.id, 'active');
                              setActiveTab('management');
                            }}
                          />
                        </div>
                      )}
                      
                      {contracts.length > 0 && !selectedContract && (
                        <div className="mt-8">
                          <h3 className="text-xl font-semibold mb-4">Contratos Existentes</h3>
                          <div className="grid gap-4">
                            {contracts.map((contract) => (
                              <div
                                key={contract.id}
                                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                                onClick={() => setSelectedContract(contract)}
                              >
                                <h4 className="font-semibold">
                                  Contrato: {contract.seller.name} → {contract.buyer.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {contract.quantity} sacas - Entrega: {new Date(contract.date).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
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
            <Route
              path="/logs"
              element={<SystemLogs />}
            />
          </Routes>
        </div>
      </Layout>
    </BrowserRouter>
  );
}

export default App;