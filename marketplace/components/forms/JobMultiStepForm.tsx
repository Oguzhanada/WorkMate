'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import EircodeAddressForm from './EircodeAddressForm';

export default function JobMultiStepForm({ customerId }: { customerId: string }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('Plumbing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetRange, setBudgetRange] = useState('€200-€500');
  const [address, setAddress] = useState<any>(null);
  const [photos, setPhotos] = useState<File[]>([]);

  const uploadPhotos = async () => {
    const urls: string[] = [];
    for (const file of photos) {
      const path = `jobs/${customerId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('job-photos').upload(path, file);
      if (!error) urls.push(path);
    }
    return urls;
  };

  const submitJob = async () => {
    const photoUrls = await uploadPhotos();
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: customerId,
        title,
        category,
        description,
        eircode: address?.eircode,
        budget_range: budgetRange,
        photo_urls: photoUrls,
      }),
    });
    setStep(1);
  };

  return (
    <div className="space-y-4">
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">1) Kategori ve İş Özeti</h2>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded border p-2" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Mutfak musluğu değişimi" className="w-full rounded border p-2" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded border p-2" />
          <button onClick={() => setStep(2)} className="rounded bg-slate-900 px-4 py-2 text-white">Devam</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">2) Adres (Eircode)</h2>
          <EircodeAddressForm onAddressSelect={setAddress} />
          <input value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} className="w-full rounded border p-2" />
          <button onClick={() => setStep(3)} className="rounded bg-slate-900 px-4 py-2 text-white">Devam</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">3) Fotoğraf Yükleme</h2>
          <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files || []))} />
          <button onClick={submitJob} className="rounded bg-emerald-700 px-4 py-2 text-white">İş Talebini Oluştur</button>
        </div>
      )}
    </div>
  );
}
