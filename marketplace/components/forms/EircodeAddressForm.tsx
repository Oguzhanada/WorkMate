'use client';

import { useState } from 'react';

type Address = {
  address_line_1: string;
  address_line_2?: string;
  locality?: string;
  county?: string;
  eircode: string;
};

export default function EircodeAddressForm({ onAddressSelect }: { onAddressSelect: (address: Address) => void }) {
  const [eircode, setEircode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async () => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/address-lookup?eircode=${encodeURIComponent(eircode)}`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Adres bulunamadı');
      return;
    }
    onAddressSelect(data.address);
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <label className="block text-sm font-medium">Eircode</label>
      <input
        value={eircode}
        onChange={(e) => setEircode(e.target.value.toUpperCase())}
        placeholder="D02 X285"
        className="w-full rounded border px-3 py-2"
      />
      <button type="button" onClick={lookup} disabled={loading} className="rounded bg-emerald-700 px-4 py-2 text-white">
        {loading ? 'Aranıyor...' : 'Adresi Bul'}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
