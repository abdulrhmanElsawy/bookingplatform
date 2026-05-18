import { Check, ChevronDown } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import styles from './SelectField.module.css';

export type SelectFieldOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectFieldProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  size?: 'md' | 'sm' | 'pill';
  variant?: 'default' | 'ghost';
  'aria-label'?: string;
  'data-testid'?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function measureMenuPosition(trigger: HTMLElement): MenuPosition {
  const rect = trigger.getBoundingClientRect();
  const gap = 6;
  const viewportPadding = 12;
  const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
  const spaceAbove = rect.top - viewportPadding;
  const preferBelow = spaceBelow >= 120 || spaceBelow >= spaceAbove;
  const maxHeight = Math.min(256, preferBelow ? spaceBelow - gap : spaceAbove - gap);
  const top = preferBelow
    ? rect.bottom + gap
    : Math.max(viewportPadding, rect.top - gap - maxHeight);

  return {
    top,
    left: rect.left,
    width: rect.width,
    maxHeight: Math.max(120, maxHeight),
  };
}

export function SelectField({
  id,
  name,
  value,
  onChange,
  options,
  disabled = false,
  placeholder,
  className = '',
  triggerClassName = '',
  size = 'md',
  variant = 'default',
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder ?? '';

  const close = useCallback(() => setOpen(false), []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setMenuPos(measureMenuPosition(trigger));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onLayout = () => updatePosition();
    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, true);
    return () => {
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, close, listId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const sizeClass =
    size === 'sm' ? styles.sizeSm : size === 'pill' ? styles.sizePill : '';
  const variantClass = variant === 'ghost' ? styles.variantGhost : '';

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${sizeClass} ${variantClass} ${className}`.trim()}
      data-testid={dataTestId}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={`${styles.trigger} ${triggerClassName} ${open ? styles.triggerOpen : ''}`.trim()}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => {
            const next = !prev;
            if (next) updatePosition();
            return next;
          });
        }}
      >
        <span
          className={`${styles.triggerLabel} ${!selected && placeholder ? styles.triggerPlaceholder : ''}`}
        >
          {displayLabel}
        </span>
        <ChevronDown className={styles.chevron} size={18} strokeWidth={2} aria-hidden />
      </button>

      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      {open && menuPos && typeof document !== 'undefined'
        ? createPortal(
            <ul
              ref={menuRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              className={styles.menu}
              style={{
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
                maxHeight: menuPos.maxHeight,
              }}
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value || '__empty'} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                      disabled={opt.disabled}
                      onClick={() => {
                        if (opt.disabled) return;
                        onChange(opt.value);
                        close();
                      }}
                    >
                      <Check className={styles.check} size={16} strokeWidth={2.5} aria-hidden />
                      <span>{opt.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
