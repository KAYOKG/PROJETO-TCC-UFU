import React, { useState } from 'react';
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

    // Verifica se já existe um cliente com o mesmo CPF
    const existingClient = clients.find(client => client.cpf === cpf);
    if (existingClient) {
      setCpfError('Já existe um cliente cadastrado com este CPF');
      return;
    }

    const client = {
      name: formData.get('name') as string,
      cpf: cpf,
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
    if (existingClient) {
      setCpfError('Já existe um cliente cadastrado com este CPF');
    } else {
      setCpfError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Informações Pessoais</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              type="text"
              name="name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">CPF</label>
            <input
              type="text"
              name="cpf"
              required
              onChange={handleCpfChange}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-brown-500 ${
                cpfError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-brown-500'
              }`}
            />
            {cpfError && (
              <p className="mt-1 text-sm text-red-600">{cpfError}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Informações Bancárias</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome do Banco</label>
            <input
              type="text"
              name="bankName"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
            <select
              name="accountType"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            >
              <option value="checking">Corrente</option>
              <option value="savings">Poupança</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número da Conta</label>
            <input
              type="text"
              name="accountNumber"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Agência</label>
            <input
              type="text"
              name="branch"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Endereço do Armazém</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Rua</label>
            <input
              type="text"
              name="street"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número</label>
            <input
              type="text"
              name="number"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Complemento</label>
            <input
              type="text"
              name="complement"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cidade</label>
            <input
              type="text"
              name="city"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <input
              type="text"
              name="state"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">CEP</label>
            <input
              type="text"
              name="zipCode"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!!cpfError}
          className={`px-4 py-2 rounded-md text-white ${
            cpfError 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-brown-600 hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-500 focus:ring-offset-2'
          }`}
        >
          Salvar Cliente
        </button>
      </div>
    </form>
  );
}