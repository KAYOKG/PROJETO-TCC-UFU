import React from 'react';
import { Contract } from '../types';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ContractPreviewProps {
  contract: Contract;
  onConfirm: () => void;
}

export function ContractPreview({ contract, onConfirm }: ContractPreviewProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Add content to PDF
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
    
    // Save the PDF
    doc.save(`contrato-cafe-${contract.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-lg shadow max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">CONTRATO DE COMPRA E VENDA DE CAFÉ</h2>

        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2">1. PARTES</h3>
            <p><strong>VENDEDOR:</strong> {contract.seller.name}</p>
            <p>CPF: {contract.seller.cpf}</p>
            <p className="mt-4"><strong>COMPRADOR:</strong> {contract.buyer.name}</p>
            <p>CPF: {contract.buyer.cpf}</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">2. OBJETO</h3>
            <p>O presente contrato tem por objeto a compra e venda de {contract.quantity} sacas de café, 
               pelo valor unitário de {formatCurrency(contract.price)}, totalizando {formatCurrency(contract.quantity * contract.price)}.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">3. LOCAL DE ENTREGA</h3>
            <p>{contract.deliveryAddress.street}, {contract.deliveryAddress.number}</p>
            {contract.deliveryAddress.complement && <p>{contract.deliveryAddress.complement}</p>}
            <p>{contract.deliveryAddress.city} - {contract.deliveryAddress.state}</p>
            <p>{contract.deliveryAddress.country}</p>
            <p>CEP: {contract.deliveryAddress.zipCode}</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">4. PRAZO DE ENTREGA</h3>
            <p>A entrega deverá ser realizada até {formatDate(contract.date)}.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">5. CONDIÇÕES DE PAGAMENTO</h3>
            <p>O pagamento será realizado mediante depósito bancário nas seguintes contas:</p>
            
            <div className="mt-2">
              <p><strong>Dados bancários do vendedor:</strong></p>
              <p>Banco: {contract.seller.bankInfo.bankName}</p>
              <p>Agência: {contract.seller.bankInfo.branch}</p>
              <p>Conta: {contract.seller.bankInfo.accountNumber}</p>
              <p>Tipo: {contract.seller.bankInfo.accountType === 'checking' ? 'Corrente' : 'Poupança'}</p>
            </div>
          </section>

          <section className="mt-12">
            <p className="text-center">
              {contract.deliveryAddress.city}, {formatDate(new Date().toISOString())}
            </p>

            <div className="mt-16 grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="border-t border-black pt-2">
                  <p>{contract.seller.name}</p>
                  <p>Vendedor</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-black pt-2">
                  <p>{contract.buyer.name}</p>
                  <p>Comprador</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      <div className="flex justify-center mt-6">
        <button
          onClick={() => {
            downloadPDF();
            onConfirm();
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-brown-600 text-white rounded-md hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-500 focus:ring-offset-2"
        >
          <Download className="h-5 w-5" />
          <span>Confirmar e Baixar Contrato</span>
        </button>
      </div>
    </div>
  );
}