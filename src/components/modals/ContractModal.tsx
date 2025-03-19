import React, { useState } from 'react';
import { Contract } from '../../types';
import { X } from 'lucide-react';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  mode: 'view' | 'edit';
  onStatusUpdate: (contractId: string, status: Contract['status']) => void;
}

export function ContractModal({
  isOpen,
  onClose,
  contract,
  mode,
  onStatusUpdate,
}: ContractModalProps) {
  const [status, setStatus] = useState(contract.status);

  if (!isOpen) return null;

  const handleStatusChange = (newStatus: Contract['status']) => {
    setStatus(newStatus);
    onStatusUpdate(contract.id, newStatus);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">
              {mode === 'edit' ? 'Editar Contrato' : 'Detalhes do Contrato'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">Status do Contrato</h3>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as Contract['status'])}
                disabled={mode === 'view'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
              >
                <option value="active">Em Progresso</option>
                <option value="completed">Concluído</option>
              </select>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Partes</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Vendedor</p>
                  <p>{contract.seller.name}</p>
                  <p className="text-sm text-gray-500">CPF: {contract.seller.cpf}</p>
                </div>
                <div>
                  <p className="font-medium">Comprador</p>
                  <p>{contract.buyer.name}</p>
                  <p className="text-sm text-gray-500">CPF: {contract.buyer.cpf}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Detalhes do Contrato</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Quantidade</p>
                  <p>{contract.quantity} sacas</p>
                </div>
                <div>
                  <p className="font-medium">Valor por Saca</p>
                  <p>{formatCurrency(contract.price)}</p>
                </div>
                <div>
                  <p className="font-medium">Valor Total</p>
                  <p>{formatCurrency(contract.quantity * contract.price)}</p>
                </div>
                <div>
                  <p className="font-medium">Data de Entrega</p>
                  <p>{formatDate(contract.date)}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Endereço de Entrega</h3>
              <p>{contract.deliveryAddress.street}, {contract.deliveryAddress.number}</p>
              {contract.deliveryAddress.complement && (
                <p>{contract.deliveryAddress.complement}</p>
              )}
              <p>
                {contract.deliveryAddress.city} - {contract.deliveryAddress.state}
              </p>
              <p>CEP: {contract.deliveryAddress.zipCode}</p>
            </section>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}