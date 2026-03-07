'use client';

import Link from 'next/link';
import {motion} from 'framer-motion';
import {usePathname} from 'next/navigation';
import WorkMateLogo from '@/components/ui/WorkMateLogo';
import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';

const highlights = [
  {emoji: '🛠️', text: '1,000+ active professionals'},
  {emoji: '📍', text: '26 counties covered'},
  {emoji: '🔒', text: 'Stripe-protected payments'},
  {emoji: '⚡', text: 'Avg. first offer in 2 hours'}
];

export default function CTASection() {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  const ctaActions = [
    {
      href: withLocalePrefix(localeRoot, '/post-job'),
      emoji: '📋',
      label: "Post a Job - it's free",
      className: 'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-lg transition',
      style: {backgroundColor: 'white', color: 'var(--wm-navy)'}
    },
    {
      href: withLocalePrefix(localeRoot, '/search'),
      emoji: '🔍',
      label: 'Browse Services',
      className:
        'inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10',
      style: undefined
    },
    {
      href: withLocalePrefix(localeRoot, '/become-provider'),
      emoji: '🔨',
      label: 'Become a Pro',
      className: 'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition',
      style: {backgroundColor: 'var(--wm-primary)'}
    }
  ];

  return (
    <motion.section
      className="px-4 py-20 sm:px-6 lg:px-8"
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.25}}
      transition={{duration: 0.45, ease: 'easeOut'}}
    >
      <div className="mx-auto max-w-7xl">
        <div
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12"
          style={{
            background: 'linear-gradient(135deg, var(--wm-navy) 0%, var(--wm-navy-mid) 60%, #1a3a6b 100%)'
          }}
        >
          {/* Background decorations */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-10"
            style={{background: 'radial-gradient(circle, var(--wm-primary), transparent 70%)'}}
          />
          <div
            className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full opacity-10"
            style={{background: 'radial-gradient(circle, var(--wm-amber), transparent 70%)'}}
          />

          {/* Amber top stripe */}
          <div
            className="absolute left-0 right-0 top-0 h-1 opacity-80"
            style={{background: 'linear-gradient(to right, var(--wm-amber), var(--wm-primary), transparent)'}}
          />

          <div className="relative z-10">
            {/* Logo mark */}
            <div className="mb-6 flex items-center gap-3">
              <WorkMateLogo size={44} />
              <span className="font-[Poppins] text-xl font-bold text-white/90">WorkMate</span>
            </div>

            <h2
              className="font-[Poppins] font-black text-white"
              style={{fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 1.1}}
            >
              Ready to Get Things Done? 🚀
            </h2>
            <p className="mt-3 max-w-xl text-lg text-white/75">
              Join thousands of Irish homeowners who stopped searching and started getting results.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/85">
              <span className="rounded-full bg-white/10 px-3 py-1">🇮🇪 Built for Ireland</span>
              <span className="rounded-full bg-white/10 px-3 py-1">💶 Transparent pricing</span>
              <span className="rounded-full bg-white/10 px-3 py-1">🛡️ Verified pros only</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {ctaActions.map((action) => (
                <motion.div key={action.label} whileHover={{scale: 1.04, y: -1}} whileTap={{scale: 0.97}}>
                  <Link href={action.href} className={action.className} style={action.style}>
                    <motion.span
                      aria-hidden
                      animate={{x: [0, 1, 0]}}
                      transition={{duration: 1.4, repeat: Infinity, ease: 'easeInOut'}}
                    >
                      {action.emoji}
                    </motion.span>
                    <span>{action.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {highlights.map((item) => (
                <motion.div
                  key={item.text}
                  whileHover={{x: 2}}
                  className="flex items-center gap-2.5 text-sm text-white/80"
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
