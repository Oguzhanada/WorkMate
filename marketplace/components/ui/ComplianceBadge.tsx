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
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
            style={{ border: '1px solid var(--wm-primary-light)', background: 'var(--wm-primary-faint)', color: 'var(--wm-primary-dark)', boxShadow: 'var(--wm-shadow-xs)' }}
            title={`Compliance Score: ${score}/100. ID, Insurance, SafePass, and Tax Clearance verified.`}
        >
            <ShieldCheck className="h-4 w-4" />
            <span>Ireland Fully Verified</span>
        </motion.div>
    );
}
