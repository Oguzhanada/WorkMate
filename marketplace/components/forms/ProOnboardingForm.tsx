'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProOnboardingForm({ profileId }: { profileId: string }) {
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);

  const uploadDoc = async (file: File, type: 'public_liability_insurance' | 'id_verification') => {
    const path = `pro-documents/${profileId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('pro-documents').upload(path, file);
    if (error) throw error;
    await supabase.from('pro_documents').insert({ profile_id: profileId, document_type: type, storage_path: path });
  };

  const submit = async () => {
    if (insuranceFile) await uploadDoc(insuranceFile, 'public_liability_insurance');
    if (idFile) await uploadDoc(idFile, 'id_verification');
    await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', profileId);
    alert('Belgeler gönderildi. Admin onayı bekleniyor.');
  };

  return (
    <div className="space-y-4 rounded border p-4">
      <h2 className="text-lg font-semibold">Pro Doğrulama Belgeleri</h2>
      <label className="block">Public Liability Insurance
        <input type="file" onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)} />
      </label>
      <label className="block">ID Verification
        <input type="file" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
      </label>
      <button onClick={submit} className="rounded bg-slate-900 px-4 py-2 text-white">Belgeleri Gönder</button>
    </div>
  );
}
