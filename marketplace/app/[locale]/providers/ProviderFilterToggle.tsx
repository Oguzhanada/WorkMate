'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

export default function ProviderFilterToggle() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Default is true if not explicitly set to 'false'
    const isVerifiedOnly = searchParams.get('verified') !== 'false';

    const toggleFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (isVerifiedOnly) {
            params.set('verified', 'false');
        } else {
            params.set('verified', 'true');
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div
          className="flex items-center gap-3 rounded-2xl p-2"
          style={{
            border: '1px solid var(--wm-border)',
            background: 'var(--wm-bg)',
            boxShadow: 'var(--wm-shadow-xs)',
          }}
        >
            <span className="pl-2 text-sm font-medium" style={{ color: 'var(--wm-text)' }}>
                Only fully verified Irish pros
            </span>
            <Button
                variant="ghost"
                size="sm"
                onClick={toggleFilter}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none !p-0"
                style={{ background: isVerifiedOnly ? 'var(--wm-primary)' : 'var(--wm-border)' }}
                role="switch"
                aria-checked={isVerifiedOnly}
            >
                <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 ${isVerifiedOnly ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </Button>
        </div>
    );
}
