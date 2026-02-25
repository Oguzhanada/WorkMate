'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProOnboardingForm({ profileId }: { profileId: string }) {
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);

  const uploadDoc = async (file: File, type: 'public_liability_insurance' | 'id_verification') => {
    const path =
      type === 'id_verification'
        ? `id-verifications/${profileId}/${Date.now()}-${file.name}`
        : `pro-documents/${profileId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('pro-documents').upload(path, file);
    if (error) throw error;
    const { data: docRow, error: insertError } = await supabase
      .from('pro_documents')
      .insert({ profile_id: profileId, document_type: type, storage_path: path })
      .select('id')
      .single();
    if (insertError) throw insertError;

    // Run AI-assisted prescreen immediately after upload; admin keeps final decision.
    await fetch('/api/verification/prescreen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_id: profileId,
        document_id: docRow.id,
      }),
    });
    return path;
  };

  const submit = async () => {
    if (insuranceFile) await uploadDoc(insuranceFile, 'public_liability_insurance');
    const idPath = idFile ? await uploadDoc(idFile, 'id_verification') : null;
    await supabase
      .from('profiles')
      .update({
        verification_status: 'pending',
        id_verification_status: idPath ? 'pending' : undefined,
        id_verification_document_url: idPath,
        id_verification_submitted_at: idPath ? new Date().toISOString() : undefined,
        id_verification_rejected_reason: null,
      })
      .eq('id', profileId);
    alert('Documents submitted. Waiting for admin approval.');
  };

  return (
    <div className="space-y-4 rounded border p-4">
      <h2 className="text-lg font-semibold">Pro Verification Documents</h2>
      <label className="block">Public Liability Insurance
        <input type="file" onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)} />
      </label>
      <label className="block">ID Verification
        <input type="file" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
      </label>
      <button onClick={submit} className="rounded bg-slate-900 px-4 py-2 text-white">Submit documents</button>
    </div>
  );
}
