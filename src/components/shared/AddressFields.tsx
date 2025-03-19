import React from 'react';

export function AddressFields() {
  return (
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
        <label className="block text-sm font-medium text-gray-700">País</label>
        <input
          type="text"
          name="country"
          required
          defaultValue="Brasil"
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
  );
}