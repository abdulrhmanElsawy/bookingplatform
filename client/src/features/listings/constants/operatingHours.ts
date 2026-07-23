import type { CreateListingPayload, ListingDetailDto } from '../api/listingsApi';

export const WEEK_DAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

export type DayHours = {
  isOpen: boolean;
  open: string;
  close: string;
};

export type HoursState = Record<WeekDay, DayHours>;

export function defaultHoursState(): HoursState {
  return WEEK_DAYS.reduce(
    (acc, day) => {
      acc[day] = { isOpen: false, open: '', close: '' };
      return acc;
    },
    {} as HoursState,
  );
}

export function hoursStateFromListing(
  operatingHours: ListingDetailDto['operatingHours'] | undefined,
): HoursState {
  const state = defaultHoursState();
  if (!operatingHours) return state;
  for (const day of WEEK_DAYS) {
    const row = operatingHours[day];
    if (!row) continue;
    state[day] = {
      isOpen: Boolean(row.isOpen),
      open: row.open ?? '',
      close: row.close ?? '',
    };
  }
  return state;
}

export function hoursStateToPayload(
  is24Hours: boolean,
  hoursByDay: HoursState,
): Pick<CreateListingPayload, 'is24Hours' | 'operatingHours'> {
  if (is24Hours) {
    return { is24Hours: true };
  }

  const operatingHours: NonNullable<CreateListingPayload['operatingHours']> = {};
  for (const day of WEEK_DAYS) {
    const row = hoursByDay[day];
    if (!row.isOpen || !row.open.trim() || !row.close.trim()) continue;
    operatingHours[day] = {
      isOpen: true,
      open: row.open.trim(),
      close: row.close.trim(),
    };
  }

  return Object.keys(operatingHours).length > 0
    ? { is24Hours: false, operatingHours }
    : { is24Hours: false };
}

export type HoursValidationResult = 'ok' | 'required' | 'invalidRange';

export function validateHoursState(
  is24Hours: boolean,
  hoursByDay: HoursState,
  options: { required: boolean },
): HoursValidationResult {
  if (is24Hours) return 'ok';

  const openDays = WEEK_DAYS.filter((day) => {
    const row = hoursByDay[day];
    return row.isOpen;
  });

  if (openDays.length === 0) {
    return options.required ? 'required' : 'ok';
  }

  for (const day of openDays) {
    const row = hoursByDay[day];
    if (!row.open.trim() || !row.close.trim()) {
      return 'required';
    }
    if (row.open >= row.close) {
      return 'invalidRange';
    }
  }

  return 'ok';
}

export function countOpenDays(hoursByDay: HoursState): number {
  return WEEK_DAYS.filter((day) => hoursByDay[day].isOpen).length;
}

/** Sun–Thu open 06:00–22:00; Fri/Sat closed (common KSA gym pattern). */
export function weekdayPresetHoursState(): HoursState {
  const state = defaultHoursState();
  const weekdayOpen = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'] as const;
  for (const day of weekdayOpen) {
    state[day] = { isOpen: true, open: '06:00', close: '22:00' };
  }
  return state;
}

export function getCurrentWeekDay(): WeekDay {
  return WEEK_DAYS[new Date().getDay()];
}

function formatTimeRange(open: string, close: string): string {
  return `${open.trim()}–${close.trim()}`;
}

/** Short value for “open now” / hours chips: `24` or `06:00–22:00` only. */
export function formatOpenHoursIndicator(source: {
  is24Hours?: boolean;
  operatingHours?: ListingDetailDto['operatingHours'];
}): string {
  if (source.is24Hours) {
    return '24';
  }

  const hours = hoursStateFromListing(source.operatingHours);
  const openDays = WEEK_DAYS.filter((day) => {
    const row = hours[day];
    return row.isOpen && row.open.trim() && row.close.trim();
  });

  if (openDays.length === 0) {
    return '—';
  }

  const first = openDays[0];
  const firstOpen = hours[first].open;
  const firstClose = hours[first].close;
  const allSame = openDays.every(
    (day) => hours[day].open === firstOpen && hours[day].close === firstClose,
  );
  if (allSame) {
    return formatTimeRange(firstOpen, firstClose);
  }

  const today = hours[getCurrentWeekDay()];
  if (today.isOpen && today.open.trim() && today.close.trim()) {
    return formatTimeRange(today.open, today.close);
  }

  return formatTimeRange(firstOpen, firstClose);
}

export function applyTimesToAllOpenDays(hoursByDay: HoursState): HoursState {
  const firstOpen = WEEK_DAYS.find((day) => hoursByDay[day].isOpen);
  if (!firstOpen) return hoursByDay;

  const { open, close } = hoursByDay[firstOpen];
  const next = { ...hoursByDay };
  for (const day of WEEK_DAYS) {
    if (next[day].isOpen) {
      next[day] = { ...next[day], open, close };
    }
  }
  return next;
}
