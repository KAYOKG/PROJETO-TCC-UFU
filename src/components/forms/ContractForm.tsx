import React, { useState } from 'react';
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Partes do Contrato</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Vendedor</label>
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            >
              <option value="">Selecione um vendedor</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Comprador</label>
            <select
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            >
              <option value="">Selecione um comprador</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Detalhes do Contrato</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantidade (sacas)</label>
            <input
              type="number"
              name="quantity"
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Preço por saca</label>
            <input
              type="number"
              name="price"
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data de Entrega</label>
            <input
              type="date"
              name="date"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Endereço de Entrega</h3>
        <AddressFields />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-brown-600 text-white px-4 py-2 rounded-md hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-500 focus:ring-offset-2"
        >
          Gerar Contrato
        </button>
      </div>
    </form>
  );
}