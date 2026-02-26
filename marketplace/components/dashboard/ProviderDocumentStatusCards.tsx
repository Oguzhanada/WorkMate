'use client';

import { motion } from 'framer-motion';

import {
  getDocumentStatusBadge,
  PROVIDER_DOCUMENT_LABELS,
  PROVIDER_REQUIRED_DOCUMENTS,
  ProviderDocumentStatus,
  ProviderDocumentType,
} from '@/lib/provider-documents';

import styles from './dashboard.module.css';

type ProviderDocument = {
  id: string;
  document_type: string;
  verification_status: string;
  expires_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
};

const REQUIRED = PROVIDER_REQUIRED_DOCUMENTS;

function latestByType(documents: ProviderDocument[], type: ProviderDocumentType) {
  const matches = documents
    .filter((doc) => doc.document_type === type)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return matches[0] ?? null;
}

export default function ProviderDocumentStatusCards({ documents }: { documents: ProviderDocument[] }) {
  return (
    <section className={styles.docStatusWrap}>
      {REQUIRED.map((type, index) => {
        const doc = latestByType(documents, type);
        const status = (doc?.verification_status ?? 'unverified') as ProviderDocumentStatus;
        const badge = getDocumentStatusBadge(status, doc?.expires_at ?? null);

        return (
          <motion.article
            key={type}
            className={styles.docStatusCard}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.22 }}
          >
            <h4>{PROVIDER_DOCUMENT_LABELS[type]}</h4>
            <p className={styles.meta}>{badge}</p>
            {status === 'rejected' && doc?.rejection_reason ? (
              <p className={styles.meta}>Reason: {doc.rejection_reason}</p>
            ) : null}
          </motion.article>
        );
      })}
    </section>
  );
}
