import type { Client, Company, Contract } from "../types";

export const MOCK_COMPANY: Company = {
  id: "company-001",
  name: "Monte Carmelo Corretora de Café LTDA",
  cnpj: "12.345.678/0001-90",
  address: {
    street: "Rua do Comércio",
    number: "450",
    complement: "Sala 12",
    city: "Monte Carmelo",
    state: "MG",
    country: "Brasil",
    zipCode: "38500-000",
  },
  bankInfo: {
    bankName: "Banco do Brasil",
    accountNumber: "12345-6",
    branch: "3021",
    accountType: "checking",
  },
};

export const MOCK_CLIENTS: Client[] = [
  {
    id: "client-001",
    name: "João Carlos da Silva",
    cpf: "123.456.789-00",
    bankInfo: {
      bankName: "Banco do Brasil",
      accountNumber: "54321-0",
      branch: "3021",
      accountType: "checking",
    },
    warehouseAddress: {
      street: "Fazenda Boa Esperança, Rod. MG-190 km 12",
      number: "S/N",
      city: "Monte Carmelo",
      state: "MG",
      country: "Brasil",
      zipCode: "38500-000",
    },
  },
  {
    id: "client-002",
    name: "Maria Aparecida Oliveira",
    cpf: "987.654.321-00",
    bankInfo: {
      bankName: "Sicoob Credimonte",
      accountNumber: "78901-2",
      branch: "0101",
      accountType: "checking",
    },
    warehouseAddress: {
      street: "Sítio São José, Estrada Municipal",
      number: "S/N",
      city: "Romaria",
      state: "MG",
      country: "Brasil",
      zipCode: "38510-000",
    },
  },
  {
    id: "client-003",
    name: "Pedro Henrique Santos",
    cpf: "456.789.123-00",
    bankInfo: {
      bankName: "Itaú Unibanco",
      accountNumber: "33456-7",
      branch: "1234",
      accountType: "checking",
    },
    warehouseAddress: {
      street: "Fazenda Cachoeira, Rod. BR-365 km 45",
      number: "S/N",
      city: "Patrocínio",
      state: "MG",
      country: "Brasil",
      zipCode: "38740-000",
    },
  },
  {
    id: "client-004",
    name: "Ana Beatriz Costa",
    cpf: "321.654.987-00",
    bankInfo: {
      bankName: "Bradesco",
      accountNumber: "11223-4",
      branch: "2567",
      accountType: "checking",
    },
    warehouseAddress: {
      street: "Av. Industrial",
      number: "1200",
      complement: "Galpão 3",
      city: "Uberlândia",
      state: "MG",
      country: "Brasil",
      zipCode: "38400-000",
    },
  },
  {
    id: "client-005",
    name: "Carlos Eduardo Mendes",
    cpf: "654.987.321-00",
    bankInfo: {
      bankName: "Caixa Econômica Federal",
      accountNumber: "99887-6",
      branch: "0450",
      accountType: "savings",
    },
    warehouseAddress: {
      street: "Fazenda Santa Rita, Estrada do Café",
      number: "S/N",
      city: "Araguari",
      state: "MG",
      country: "Brasil",
      zipCode: "38440-000",
    },
  },
];

function createMockContracts(clients: Client[]): Contract[] {
  return [
    {
      id: "contract-001",
      seller: clients[0],
      buyer: clients[3],
      deliveryAddress: clients[3].warehouseAddress,
      quantity: 500,
      price: 1450.0,
      date: "2025-08-15",
      status: "active",
    },
    {
      id: "contract-002",
      seller: clients[2],
      buyer: clients[1],
      deliveryAddress: clients[1].warehouseAddress,
      quantity: 300,
      price: 1380.0,
      date: "2025-09-20",
      status: "pending",
    },
    {
      id: "contract-003",
      seller: clients[4],
      buyer: clients[3],
      deliveryAddress: clients[3].warehouseAddress,
      quantity: 200,
      price: 1520.0,
      date: "2025-06-10",
      status: "completed",
    },
    {
      id: "contract-004",
      seller: clients[0],
      buyer: clients[4],
      deliveryAddress: clients[4].warehouseAddress,
      quantity: 150,
      price: 1410.0,
      date: "2025-10-05",
      status: "pending",
    },
  ];
}

export const MOCK_CONTRACTS: Contract[] = createMockContracts(MOCK_CLIENTS);
