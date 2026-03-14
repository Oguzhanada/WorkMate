import { useCallback, useEffect, useState } from 'react';
import type { ActionModalState, Application, Decision, Filters } from './admin-applications-types';
import { findDocument, mapDocLabel } from './admin-applications-helpers';

type ApplyOptimistic = (
  action:
    | { type: 'set_status'; profileId: string; status: string }
    | { type: 'bulk_set_status'; profileIds: string[]; status: string }
) => void;

type UseApplicationActionsParams = {
  setFeedback: (msg: string) => void;
  applyOptimistic: ApplyOptimistic;
  loadApplications: (filters: Filters) => Promise<void>;
  loadStats: () => Promise<void>;
  filtersApplied: Filters;
  pageItems: Application[];
  onAfterReload?: () => void;
};

export function useApplicationActions({
  setFeedback,
  applyOptimistic,
  loadApplications,
  loadStats,
  filtersApplied,
  pageItems,
  onAfterReload,
}: UseApplicationActionsParams) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionModalState | null>(null);
  const [actionInput, setActionInput] = useState('');
  const [submittingModal, setSubmittingModal] = useState(false);
  const [pendingActionKeys, setPendingActionKeys] = useState<Record<string, boolean>>({});
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  useEffect(() => {
    const onDocumentPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-admin-menu-root="true"]')) return;
      setOpenMenuId(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenMenuId(null);
      if (previewDocUrl) setPreviewDocUrl(null);
      if (!submittingModal) {
        setActionModal(null);
        setActionInput('');
      }
    };

    document.addEventListener('mousedown', onDocumentPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocumentPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [previewDocUrl, submittingModal]);

  const setPendingAction = (key: string, pending: boolean) => {
    setPendingActionKeys((current) => {
      if (pending) return { ...current, [key]: true };
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const isActionPending = (key: string) => Boolean(pendingActionKeys[key]);

  const isProfileBusy = (profileId: string) =>
    Object.keys(pendingActionKeys).some((key) => key.startsWith(`profile:${profileId}:`));

  const decisionDefaultNote = (decision: Decision) =>
    decision === 'approve'
      ? 'Approved by admin'
      : decision === 'request_changes'
      ? 'Please update the missing items.'
      : 'Rejected by admin';

  const openActionModal = (nextModal: ActionModalState) => {
    setActionModal(nextModal);
    setActionInput(nextModal.defaultValue);
  };

  const closeActionModal = (force = false) => {
    if (!force && submittingModal) return;
    setActionModal(null);
    setActionInput('');
  };

  const runDecision = (profileId: string, decision: Decision) => {
    openActionModal({
      kind: 'single_decision',
      profileId,
      decision,
      title: decision === 'approve' ? 'Approve Application' : decision === 'reject' ? 'Reject Application' : 'Request Changes',
      submitLabel: decision === 'approve' ? 'Approve' : decision === 'reject' ? 'Reject' : 'Request Changes',
      defaultValue: decisionDefaultNote(decision),
    });
  };

  const runBulkDecision = (decision: 'approve' | 'reject') => {
    if (selectedIds.length === 0) {
      setFeedback('Select at least one record.');
      return;
    }

    openActionModal({
      kind: 'bulk_decision',
      profileIds: selectedIds,
      decision,
      title: decision === 'approve' ? 'Bulk Approve Applications' : 'Bulk Reject Applications',
      submitLabel: decision === 'approve' ? 'Approve selected' : 'Reject selected',
      defaultValue: decision === 'approve' ? 'Approved in bulk' : 'Rejected in bulk',
    });
  };

  const sendBulkNotice = () => {
    if (selectedIds.length === 0) {
      setFeedback('Select at least one provider/customer.');
      return;
    }

    openActionModal({
      kind: 'message',
      profileIds: selectedIds,
      title: 'Send Notification',
      submitLabel: 'Send notification',
      defaultValue: 'Please update your profile information.',
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pageItems.length) {
      setSelectedIds((current) => current.filter((id) => !pageItems.some((item) => item.id === id)));
      return;
    }

    const next = new Set(selectedIds);
    for (const row of pageItems) next.add(row.id);
    setSelectedIds(Array.from(next));
  };

  const toggleSelect = (profileId: string) => {
    setSelectedIds((current) => (current.includes(profileId) ? current.filter((id) => id !== profileId) : [...current, profileId]));
  };

  const runChecklistItem = async (application: Application, documentType: string) => {
    const found = findDocument(application.documents, documentType);
    if (!found?.id) {
      setFeedback(`${mapDocLabel(documentType)} is missing. Ask user to upload this document.`);
      return;
    }

    const actionKey = `profile:${application.id}:checklist:${documentType}`;
    setPendingAction(actionKey, true);
    try {
      const response = await fetch(`/api/admin/provider-applications/${application.id}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: found.id, decision: 'approve', note: `${mapDocLabel(documentType)} verified.` }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setFeedback(payload.error || 'Checklist update failed.');
        return;
      }

      setFeedback(`${mapDocLabel(documentType)} marked as verified.`);
      await reloadAndReset();
    } finally {
      setPendingAction(actionKey, false);
    }
  };

  const approveAllDocuments = (profileId: string) => {
    openActionModal({
      kind: 'approve_all_documents',
      profileId,
      title: 'Approve All Required Documents',
      submitLabel: 'Approve all docs',
      defaultValue: 'All required documents verified.',
    });
  };

  const submitActionModal = async () => {
    if (!actionModal) return;

    const value = actionInput.trim();
    if (!value) {
      setFeedback(actionModal.kind === 'message' ? 'Message is required.' : 'Review note is required.');
      return;
    }

    const actionKey =
      actionModal.kind === 'single_decision'
        ? `profile:${actionModal.profileId}:decision`
        : actionModal.kind === 'approve_all_documents'
        ? `profile:${actionModal.profileId}:approve_all_documents`
        : actionModal.kind === 'bulk_decision'
        ? `global:bulk_decision:${actionModal.decision}`
        : actionModal.profileIds.length === 1
        ? `profile:${actionModal.profileIds[0]}:message`
        : 'global:bulk_notice';

    setSubmittingModal(true);
    setPendingAction(actionKey, true);

    try {
      if (actionModal.kind === 'single_decision') {
        const optimisticStatus =
          actionModal.decision === 'approve'
            ? 'verified'
            : actionModal.decision === 'reject'
            ? 'rejected'
            : 'pending';
        applyOptimistic({ type: 'set_status', profileId: actionModal.profileId, status: optimisticStatus });

        const response = await fetch('/api/admin/provider-applications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_id: actionModal.profileId, decision: actionModal.decision, note: value }),
        });
        const payload = await response.json();
        if (!response.ok) {
          setFeedback(payload.error || 'Action failed.');
          return;
        }

        setFeedback(
          actionModal.decision === 'approve'
            ? 'Application approved.'
            : actionModal.decision === 'reject'
            ? 'Application rejected.'
            : 'Changes requested.'
        );
        closeActionModal(true);
        await loadApplications(filtersApplied);
        await loadStats();
        return;
      }

      if (actionModal.kind === 'bulk_decision') {
        applyOptimistic({
          type: 'bulk_set_status',
          profileIds: actionModal.profileIds,
          status: actionModal.decision === 'approve' ? 'verified' : 'rejected',
        });

        const results = await Promise.allSettled(
          actionModal.profileIds.map((profileId) =>
            fetch('/api/admin/provider-applications', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profile_id: profileId, decision: actionModal.decision, note: value }),
            }).then((res) => res.json().then((body) => ({ ok: res.ok, body })))
          )
        );

        const failed = results.filter((item) => item.status === 'fulfilled' && !item.value.ok).length;
        const succeeded = results.length - failed;
        setFeedback(failed > 0 ? `${succeeded} updated, ${failed} failed.` : `${succeeded} applications updated.`);
        closeActionModal(true);
        await loadApplications(filtersApplied);
        await loadStats();
        return;
      }

      if (actionModal.kind === 'message') {
        const response = await fetch('/api/admin/provider-applications/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_ids: actionModal.profileIds, message: value }),
        });

        const payload = await response.json();
        if (!response.ok) {
          setFeedback(payload.error || 'Notification failed.');
          return;
        }

        setFeedback(`Notification sent to ${payload.count} users.`);
        closeActionModal(true);
        return;
      }

      const response = await fetch(`/api/admin/provider-applications/${actionModal.profileId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: value }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setFeedback(payload.error || 'Bulk document approval failed.');
        return;
      }

      setFeedback(`Approved ${payload.updated} required documents.`);
      closeActionModal(true);
      await reloadAndReset();
    } finally {
      setPendingAction(actionKey, false);
      setSubmittingModal(false);
    }
  };

  /** Reset selection state (called when applications reload) */
  const resetSelections = useCallback(() => {
    setSelectedIds([]);
    setExpandedId(null);
    setOpenMenuId(null);
  }, []);

  const reloadAndReset = async () => {
    await loadApplications(filtersApplied);
    await loadStats();
    resetSelections();
    onAfterReload?.();
  };

  return {
    selectedIds,
    expandedId,
    setExpandedId,
    openMenuId,
    setOpenMenuId,
    actionModal,
    actionInput,
    setActionInput,
    submittingModal,
    previewDocUrl,
    setPreviewDocUrl,
    isActionPending,
    isProfileBusy,
    openActionModal,
    closeActionModal,
    runDecision,
    runBulkDecision,
    sendBulkNotice,
    toggleSelectAll,
    toggleSelect,
    runChecklistItem,
    approveAllDocuments,
    submitActionModal,
    resetSelections,
  };
}
