'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

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
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="pl-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Only fully verified Irish pros
            </span>
            <button
                type="button"
                onClick={toggleFilter}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${isVerifiedOnly ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`}
                role="switch"
                aria-checked={isVerifiedOnly}
            >
                <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 ${isVerifiedOnly ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );
}
