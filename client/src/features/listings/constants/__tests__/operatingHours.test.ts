import {
  applyTimesToAllOpenDays,
  countOpenDays,
  defaultHoursState,
  hoursStateFromListing,
  hoursStateToPayload,
  validateHoursState,
  weekdayPresetHoursState,
} from '../operatingHours';

describe('operatingHours helpers', () => {
  it('maps listing hours into form state', () => {
    const state = hoursStateFromListing({
      monday: { isOpen: true, open: '09:00', close: '17:00' },
    });
    expect(state.monday).toEqual({ isOpen: true, open: '09:00', close: '17:00' });
    expect(state.tuesday.isOpen).toBe(false);
  });

  it('builds 24h payload', () => {
    expect(hoursStateToPayload(true, defaultHoursState())).toEqual({ is24Hours: true });
  });

  it('builds per-day payload for open days only', () => {
    const state = defaultHoursState();
    state.monday = { isOpen: true, open: '06:00', close: '22:00' };
    expect(hoursStateToPayload(false, state)).toEqual({
      is24Hours: false,
      operatingHours: {
        monday: { isOpen: true, open: '06:00', close: '22:00' },
      },
    });
  });

  it('validates required and time range', () => {
    expect(validateHoursState(true, defaultHoursState(), { required: true })).toBe('ok');
    expect(validateHoursState(false, defaultHoursState(), { required: true })).toBe('required');

    const state = defaultHoursState();
    state.monday = { isOpen: true, open: '22:00', close: '06:00' };
    expect(validateHoursState(false, state, { required: true })).toBe('invalidRange');
  });

  it('applies first open day times to all other open days', () => {
    const preset = weekdayPresetHoursState();
    expect(countOpenDays(preset)).toBe(5);
    preset.sunday.open = '08:00';
    preset.sunday.close = '20:00';
    const applied = applyTimesToAllOpenDays(preset);
    expect(applied.monday.open).toBe('08:00');
    expect(applied.thursday.close).toBe('20:00');
  });
});
