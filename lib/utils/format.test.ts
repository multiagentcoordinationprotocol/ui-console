import { describe, it, expect } from 'vitest';
import {
  formatDateTime,
  formatRelativeDuration,
  formatNumber,
  formatPercent,
  formatCurrency,
  titleCase,
  truncate,
  getStatusTone
} from './format';

describe('formatDateTime', () => {
  it('returns em-dash for undefined', () => {
    expect(formatDateTime()).toBe('—');
  });

  it('returns em-dash for invalid date string', () => {
    expect(formatDateTime('not-a-date')).toBe('—');
  });

  it('formats a valid ISO string', () => {
    const result = formatDateTime('2025-01-15T10:30:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  it('formats a Date object', () => {
    const result = formatDateTime(new Date('2025-06-01T12:00:00Z'));
    expect(result).toContain('Jun');
    expect(result).toContain('2025');
  });

  it('formats a numeric timestamp', () => {
    const result = formatDateTime(1700000000000);
    expect(result).toContain('2023');
  });
});

describe('formatRelativeDuration', () => {
  it('returns em-dash for undefined', () => {
    expect(formatRelativeDuration()).toBe('—');
  });

  it('returns em-dash for negative ms', () => {
    expect(formatRelativeDuration(-100)).toBe('—');
  });

  it('returns em-dash for zero', () => {
    expect(formatRelativeDuration(0)).toBe('—');
  });

  it('returns seconds for < 60s', () => {
    expect(formatRelativeDuration(5000)).toBe('5s');
    expect(formatRelativeDuration(59000)).toBe('59s');
  });

  it('returns minutes and seconds for < 60m', () => {
    expect(formatRelativeDuration(90000)).toBe('1m 30s');
    expect(formatRelativeDuration(3599000)).toBe('59m 59s');
  });

  it('returns hours and minutes for >= 60m', () => {
    expect(formatRelativeDuration(3600000)).toBe('1h 0m');
    expect(formatRelativeDuration(7200000 + 1800000)).toBe('2h 30m');
  });
});

describe('formatNumber', () => {
  it('returns em-dash for undefined', () => {
    expect(formatNumber(undefined)).toBe('—');
  });

  it('returns em-dash for NaN', () => {
    expect(formatNumber(NaN)).toBe('—');
  });

  it('formats a whole number', () => {
    expect(formatNumber(1234)).toBe('1,234');
  });

  it('passes NumberFormat options through', () => {
    expect(formatNumber(1234.5, { minimumFractionDigits: 2 })).toBe('1,234.50');
  });
});

describe('formatPercent', () => {
  it('returns em-dash for undefined', () => {
    expect(formatPercent(undefined)).toBe('—');
  });

  it('treats values <= 1 as fractions', () => {
    expect(formatPercent(0.95)).toBe('95%');
  });

  it('treats values > 1 as percentages (divides by 100)', () => {
    expect(formatPercent(95)).toBe('95%');
  });
});

describe('formatCurrency', () => {
  it('returns em-dash for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('formats USD with 2 decimal places', () => {
    const result = formatCurrency(12.5);
    expect(result).toContain('12.50');
  });
});

describe('titleCase', () => {
  it('converts snake_case', () => {
    expect(titleCase('hello_world')).toBe('Hello World');
  });

  it('converts kebab-case', () => {
    expect(titleCase('hello-world')).toBe('Hello World');
  });

  it('handles empty string', () => {
    expect(titleCase('')).toBe('');
  });

  it('handles single word', () => {
    expect(titleCase('hello')).toBe('Hello');
  });
});

describe('truncate', () => {
  it('returns string unchanged if under max', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  it('truncates and adds ellipsis at max', () => {
    expect(truncate('hello world', 6)).toBe('hello…');
  });

  it('uses default max of 120', () => {
    const longStr = 'a'.repeat(200);
    const result = truncate(longStr);
    expect(result.length).toBe(120);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('getStatusTone', () => {
  it('maps completed to success', () => {
    expect(getStatusTone('completed')).toBe('success');
  });

  it('maps running to info', () => {
    expect(getStatusTone('running')).toBe('info');
  });

  it('maps queued to warning', () => {
    expect(getStatusTone('queued')).toBe('warning');
  });

  it('maps failed to danger', () => {
    expect(getStatusTone('failed')).toBe('danger');
  });

  it('maps cancelled to danger', () => {
    expect(getStatusTone('cancelled')).toBe('danger');
  });

  it('maps unknown status to neutral', () => {
    expect(getStatusTone('something-else')).toBe('neutral');
  });
});
