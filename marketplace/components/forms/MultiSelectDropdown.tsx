"use client";

import {useMemo, useState} from 'react';

import styles from './multi-select-dropdown.module.css';

type Option = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  options: Option[];
  selectedValues: string[];
  placeholder: string;
  onToggle: (value: string) => void;
};

export default function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  placeholder,
  onToggle
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (selectedValues.length === 0) return '';
    const names = options
      .filter((item) => selectedValues.includes(item.value))
      .map((item) => item.label);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  }, [options, selectedValues]);

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={selectedLabel ? styles.value : styles.placeholder}>
          {selectedLabel || placeholder}
        </span>
        <i className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
      </button>

      {open ? (
        <div className={styles.panel}>
          {options.map((item) => (
            <label key={item.value} className={styles.item}>
              <input
                type="checkbox"
                checked={selectedValues.includes(item.value)}
                onChange={() => onToggle(item.value)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
