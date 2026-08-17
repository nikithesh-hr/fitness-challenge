import { describe, it, expect } from 'vitest';
import { SPORT_META, formatMetric } from '../../utils/sportMeta';

describe('SPORT_META', () => {
  const EXPECTED_SPORTS = ['RUNNING', 'WALKING', 'CYCLING', 'GYM', 'SWIMMING', 'DAILY_STEPS'];

  it('contains all 6 required sports', () => {
    EXPECTED_SPORTS.forEach((sport) => {
      expect(SPORT_META).toHaveProperty(sport);
    });
  });

  it.each(EXPECTED_SPORTS)('%s has icon, label, and color', (sport) => {
    const meta = SPORT_META[sport];
    expect(meta.icon).toBeTruthy();
    expect(meta.label).toBeTruthy();
    expect(meta.color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('has correct labels for each sport', () => {
    expect(SPORT_META.RUNNING.label).toBe('Running');
    expect(SPORT_META.WALKING.label).toBe('Walking');
    expect(SPORT_META.CYCLING.label).toBe('Cycling');
    expect(SPORT_META.GYM.label).toBe('Gym');
    expect(SPORT_META.SWIMMING.label).toBe('Swimming');
    expect(SPORT_META.DAILY_STEPS.label).toBe('Daily Steps');
  });
});

describe('formatMetric', () => {
  // ── Distance sports ────────────────────────────────────────────────────────

  it('RUNNING — shows distanceKm with km unit', () => {
    expect(formatMetric({ sport: 'RUNNING', distanceKm: 5.25 })).toBe('5.25 km');
  });

  it('WALKING — shows distanceKm with km unit', () => {
    expect(formatMetric({ sport: 'WALKING', distanceKm: 1.55 })).toBe('1.55 km');
  });

  it('CYCLING — shows distanceKm with km unit', () => {
    expect(formatMetric({ sport: 'CYCLING', distanceKm: 3.7 })).toBe('3.7 km');
  });

  // ── Duration sports ────────────────────────────────────────────────────────

  it('GYM — shows minutes and seconds', () => {
    expect(formatMetric({ sport: 'GYM', durationMinutes: 45, durationSeconds: 50 })).toBe('45m 50s');
  });

  it('SWIMMING — shows minutes and seconds', () => {
    expect(formatMetric({ sport: 'SWIMMING', durationMinutes: 30, durationSeconds: 0 })).toBe('30m 0s');
  });

  it('GYM — null durationMinutes defaults to 0', () => {
    expect(formatMetric({ sport: 'GYM', durationMinutes: null, durationSeconds: 30 })).toBe('0m 30s');
  });

  it('GYM — null durationSeconds defaults to 0', () => {
    expect(formatMetric({ sport: 'GYM', durationMinutes: 45, durationSeconds: null })).toBe('45m 0s');
  });

  it('SWIMMING — both null → 0m 0s', () => {
    expect(formatMetric({ sport: 'SWIMMING', durationMinutes: null, durationSeconds: null })).toBe('0m 0s');
  });

  // ── Steps sport ────────────────────────────────────────────────────────────

  it('DAILY_STEPS — shows step count with "steps"', () => {
    expect(formatMetric({ sport: 'DAILY_STEPS', stepCount: 8450 })).toContain('steps');
  });

  it('DAILY_STEPS — 8450 → "8,450 steps" (locale formatted)', () => {
    const result = formatMetric({ sport: 'DAILY_STEPS', stepCount: 8450 });
    expect(result).toBe('8,450 steps');
  });

  it('DAILY_STEPS — 100 steps → "100 steps"', () => {
    expect(formatMetric({ sport: 'DAILY_STEPS', stepCount: 100 })).toBe('100 steps');
  });

  // ── Unknown sport ──────────────────────────────────────────────────────────

  it('Unknown sport → returns em-dash "—"', () => {
    expect(formatMetric({ sport: 'YOGA' })).toBe('—');
  });

  it('Empty sport string → returns em-dash "—"', () => {
    expect(formatMetric({ sport: '' })).toBe('—');
  });
});
