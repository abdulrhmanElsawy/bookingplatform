import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

import styles from './OTPInput.module.css';

const LEN = 6;

function onlyDigits(s: string): string {
  return s.replace(/\D/g, '').slice(0, LEN);
}

interface OTPInputProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

export function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  const { t } = useTranslation('auth');
  const id = useId();
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focusIndex = useCallback((i: number) => {
    const el = refs.current[Math.max(0, Math.min(LEN - 1, i))];
    el?.focus();
    el?.select();
  }, []);

  useEffect(() => {
    focusIndex(0);
  }, [focusIndex]);

  const onPasteRow = useCallback(
    (e: ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = onlyDigits(e.clipboardData.getData('text'));
      onChange(text);
      focusIndex(Math.min(text.length, LEN - 1));
    },
    [focusIndex, onChange],
  );

  const onChangeAt = useCallback(
    (idx: number, input: string) => {
      const d = onlyDigits(input).slice(-1) ?? '';
      const cur = onlyDigits(value);
      let next: string;
      if (!d) {
        next = cur.slice(0, idx) + cur.slice(idx + 1);
      } else {
        next = (cur.slice(0, idx) + d + cur.slice(idx + 1)).slice(0, LEN);
      }
      onChange(next);
      if (d && idx < LEN - 1) {
        focusIndex(idx + 1);
      }
    },
    [focusIndex, onChange, value],
  );

  const onKeyDown = useCallback(
    (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const cur = onlyDigits(value);
        if (cur.length > idx) {
          onChange(cur.slice(0, idx) + cur.slice(idx + 1));
          return;
        }
        if (cur.length === idx && idx > 0) {
          onChange(cur.slice(0, idx - 1));
          focusIndex(idx - 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        focusIndex(idx - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        focusIndex(idx + 1);
      }
    },
    [focusIndex, onChange, value],
  );

  const padded = onlyDigits(value).padEnd(LEN, ' ');

  return (
    <div data-testid="otp-input">
      <span className={styles.hiddenLabel} id={`${id}-otp-label`}>
        {t('otpTitle')}
      </span>
      <div
        className={styles.row}
        role="group"
        aria-labelledby={`${id}-otp-label`}
        onPaste={onPasteRow}
      >
        {Array.from({ length: LEN }, (_, i) => (
          <input
            key={`otp-${String(i)}`}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={styles.box}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={disabled}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`${t('otpTitle')} ${String(i + 1)}`}
            value={padded[i] === ' ' ? '' : padded[i]}
            onChange={(e) => onChangeAt(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
          />
        ))}
      </div>
    </div>
  );
}
