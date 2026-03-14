import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_FILTERS, type Application, type Filters, type SortField } from './admin-applications-types';

/**
 * Manages filter state, sorting state, and pagination state.
 * The `computeSorted` method produces sorted/paginated results
 * from a given list of applications.
 */
export function useApplicationFilters() {
  const [filtersDraft, setFiltersDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [filtersApplied, setFiltersApplied] = useState<Filters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filtersDraft.q !== filtersApplied.q) {
        setFiltersApplied((current) => ({ ...current, q: filtersDraft.q }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filtersDraft.q, filtersApplied.q]);

  const advancedActiveCount = useMemo(() => {
    let count = 0;
    if (filtersDraft.start_date) count++;
    if (filtersDraft.end_date) count++;
    if (filtersDraft.id_verification_status !== 'all') count++;
    if (filtersDraft.has_documents !== 'any') count++;
    if (filtersDraft.status !== 'all') count++;
    if (filtersDraft.review_type !== 'all' && filtersDraft.review_type !== 'customer_identity_review') count++;
    if (filtersDraft.county !== 'all') count++;
    return count;
  }, [filtersDraft]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };

  const applyStatusFilter = (status: Filters['status']) => {
    setFiltersDraft((current) => ({ ...current, status }));
    setFiltersApplied((current) => ({ ...current, status }));
  };

  return {
    filtersDraft,
    setFiltersDraft,
    filtersApplied,
    setFiltersApplied,
    sortField,
    sortDirection,
    page,
    setPage,
    pageSize,
    setPageSize,
    advancedActiveCount,
    toggleSort,
    applyStatusFilter,
  };
}

/**
 * Computes derived sorted/paginated/service-options data from
 * optimistic applications and filter/sort state.
 */
export function useFilteredApplications(
  optimisticApplications: Application[],
  sortField: SortField,
  sortDirection: 'asc' | 'desc',
  page: number,
  setPage: (v: number | ((c: number) => number)) => void,
  pageSize: number,
) {
  const serviceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of optimisticApplications) {
      for (const service of item.stripe_requirements_due?.services_and_skills?.services ?? []) {
        set.add(service);
      }
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [optimisticApplications]);

  const sortedApplications = useMemo(() => {
    const list = [...optimisticApplications];
    list.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      const aCategory = a.stripe_requirements_due?.services_and_skills?.services?.[0] ?? '-';
      const bCategory = b.stripe_requirements_due?.services_and_skills?.services?.[0] ?? '-';
      const aCounty = a.address?.county ?? '-';
      const bCounty = b.address?.county ?? '-';

      if (sortField === 'created_at') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
      }

      if (sortField === 'documents') {
        return (a.documents.length - b.documents.length) * direction;
      }

      if (sortField === 'category') {
        return aCategory.localeCompare(bCategory) * direction;
      }

      if (sortField === 'county') {
        return aCounty.localeCompare(bCounty) * direction;
      }

      const av = String((a as Record<string, unknown>)[sortField] ?? '');
      const bv = String((b as Record<string, unknown>)[sortField] ?? '');
      return av.localeCompare(bv) * direction;
    });
    return list;
  }, [optimisticApplications, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedApplications.length / pageSize));
  const pageItems = sortedApplications.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  const exportCsv = () => {
    const rows = sortedApplications.map((item) => ({
      name: item.full_name ?? '',
      phone: item.phone ?? '',
      type: item.review_type ?? 'other',
      category: (item.stripe_requirements_due?.services_and_skills?.services ?? []).join('|'),
      county: item.address?.county ?? '',
      created_at: item.created_at,
      status: item.verification_status,
      documents: item.documents.map((doc) => doc.document_type).join('|'),
      id: item.id,
    }));

    const header = Object.keys(rows[0] ?? { name: '', phone: '', type: '', category: '', county: '', created_at: '', status: '', documents: '', id: '' });
    const csv = [
      header.join(','),
      ...rows.map((row) => header.map((key) => `"${String((row as Record<string, string>)[key] ?? '').replaceAll('"', '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    serviceOptions,
    sortedApplications,
    totalPages,
    pageItems,
    exportCsv,
  };
}
