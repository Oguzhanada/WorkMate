'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';

type ChipDef = { label: string; removeParam: string };

export default function ActiveFilterChips({
  chips,
}: {
  chips: ChipDef[];
  locale: string;
}) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  function removeFilter(param: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(param);
    params.delete('page');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium" style={{ color: 'var(--wm-muted)' }}>
        Active filters:
      </span>
      {chips.map((chip) => (
        <Button
          key={chip.removeParam}
          variant="ghost"
          size="sm"
          onClick={() => removeFilter(chip.removeParam)}
          className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold transition-opacity hover:opacity-70"
          style={{
            background: 'var(--wm-primary-light)',
            color: 'var(--wm-primary-dark)',
            border: '1px solid rgba(0,184,148,0.25)',
          }}
          aria-label={`Remove filter: ${chip.label}`}
        >
          {chip.label}
          <span aria-hidden="true" className="ml-0.5 font-bold">×</span>
        </Button>
      ))}
    </div>
  );
}
