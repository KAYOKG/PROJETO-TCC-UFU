import React, { useState } from 'react';
import { Contract } from '../types';
import { Eye, Pencil, Trash2, Search } from 'lucide-react';
import { DeleteConfirmationModal } from './modals/DeleteConfirmationModal';
import { ContractModal } from './modals/ContractModal';

interface ContractManagementProps {
  contracts: Contract[];
  onStatusUpdate: (contractId: string, status: Contract['status']) => void;
  onDelete: (contractId: string) => void;
}

export function ContractManagement({ contracts, onStatusUpdate, onDelete }: ContractManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);

  const handleView = (contract: Contract) => {
    setSelectedContract(contract);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (contract: Contract) => {
    setContractToDelete(contract);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (contractToDelete) {
      onDelete(contractToDelete.id);
      setContractToDelete(null);
    }
  };

  const filteredContracts = contracts.filter(contract =>
    contract.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.buyer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Pesquisar por vendedor ou comprador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comprador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data de Entrega
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredContracts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Nenhum contrato encontrado
                </td>
              </tr>
            ) : (
              filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{contract.seller.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{contract.buyer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{contract.quantity} sacas</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(contract.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={contract.status}
                      onChange={(e) => onStatusUpdate(contract.id, e.target.value as Contract['status'])}
                      className="text-sm rounded-md border-gray-300 shadow-sm focus:border-brown-500 focus:ring-brown-500"
                    >
                      <option value="active">Em Progresso</option>
                      <option value="completed">Concluído</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleView(contract)}
                        className="text-brown-600 hover:text-brown-900"
                        title="Ver detalhes"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(contract)}
                        className="text-brown-600 hover:text-brown-900"
                        title="Editar"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(contract)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedContract && (
        <ContractModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contract={selectedContract}
          mode={modalMode}
          onStatusUpdate={onStatusUpdate}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setContractToDelete(null);
        }}
        onConfirm={confirmDelete}
        clientName={`contrato entre ${contractToDelete?.seller.name} e ${contractToDelete?.buyer.name}`}
      />
    </div>
  );
}