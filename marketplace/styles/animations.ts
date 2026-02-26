import { Variants } from 'framer-motion';

export const pageContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
};

export const leftColumnVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const rightColumnVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const formListVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

export const formItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
};

export const dropdownContentVariants: Variants = {
  closed: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
  open: {
    opacity: 1,
    height: 'auto',
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

export const heroStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

export const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.45, ease: 'easeOut'}
  }
};

export const sectionRevealVariants: Variants = {
  hidden: {opacity: 0, y: 24, scale: 0.98},
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {duration: 0.45, ease: 'easeOut'}
  }
};
