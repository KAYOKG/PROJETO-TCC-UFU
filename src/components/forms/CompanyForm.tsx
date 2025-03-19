import React from 'react';
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
        zipCode: formData.get('zipCode') as string,
      },
    };

    onSubmit(companyData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Informações da Empresa</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
            <input
              type="text"
              name="name"
              defaultValue={company?.name}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">CNPJ</label>
            <input
              type="text"
              name="cnpj"
              defaultValue={company?.cnpj}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
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
              defaultValue={company?.bankInfo.bankName}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
            <select
              name="accountType"
              defaultValue={company?.bankInfo.accountType}
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
              defaultValue={company?.bankInfo.accountNumber}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Agência</label>
            <input
              type="text"
              name="branch"
              defaultValue={company?.bankInfo.branch}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Endereço da Empresa</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Rua</label>
            <input
              type="text"
              name="street"
              defaultValue={company?.address.street}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número</label>
            <input
              type="text"
              name="number"
              defaultValue={company?.address.number}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Complemento</label>
            <input
              type="text"
              name="complement"
              defaultValue={company?.address.complement}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cidade</label>
            <input
              type="text"
              name="city"
              defaultValue={company?.address.city}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <input
              type="text"
              name="state"
              defaultValue={company?.address.state}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">CEP</label>
            <input
              type="text"
              name="zipCode"
              defaultValue={company?.address.zipCode}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-brown-600 text-white px-4 py-2 rounded-md hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-500 focus:ring-offset-2"
        >
          {company ? 'Atualizar Empresa' : 'Cadastrar Empresa'}
        </button>
      </div>
    </form>
  );
}