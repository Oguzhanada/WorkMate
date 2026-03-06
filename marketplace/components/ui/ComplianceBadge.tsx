'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

type Props = {
    score: number;
    className?: string;
};

export default function ComplianceBadge({ score, className = '' }: Props) {
    if (score < 80) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 ${className}`}
            title={`Compliance Score: ${score}/100. ID, Insurance, SafePass, and Tax Clearance verified.`}
        >
            <ShieldCheck className="h-4 w-4" />
            <span>Ireland Fully Verified</span>
        </motion.div>
    );
}
