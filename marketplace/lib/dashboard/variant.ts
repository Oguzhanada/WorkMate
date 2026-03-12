// Dashboard variant system
// 3 visual variants per dashboard type, persisted in localStorage

export type DashboardType = 'admin' | 'customer' | 'pro';
export type VariantId = 'v1' | 'v2' | 'v3';

export type VariantMeta = {
  id: VariantId;
  label: string;
  description: string;
  preview: string; // emoji/icon shorthand
};

export const VARIANT_META: VariantMeta[] = [
  { id: 'v1', label: 'Ireland', description: 'Clean cards — Ireland palette', preview: '🍀' },
  { id: 'v2', label: 'Analytics', description: 'Sidebar + charts, data-dense', preview: '📊' },
  { id: 'v3', label: 'Dark', description: 'Dark command centre', preview: '🌙' },
];

const STORAGE_KEY = (type: DashboardType) => `wm_dash_variant_${type}`;
const DEFAULT_VARIANT: VariantId = 'v1';

export function getVariant(type: DashboardType): VariantId {
  if (typeof window === 'undefined') return DEFAULT_VARIANT;
  return (localStorage.getItem(STORAGE_KEY(type)) as VariantId) ?? DEFAULT_VARIANT;
}

export function setVariant(type: DashboardType, variant: VariantId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY(type), variant);
}
