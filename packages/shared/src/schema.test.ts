import { describe, it, expect } from 'vitest';
import {
  MoodCreateInputSchema,
  SleepReportInputSchema,
  DialogStartInputSchema,
  DialogTurnInputSchema,
  AccountDeleteInputSchema,
  MagicLinkRequestSchema,
  HistoryQuerySchema,
  MoodRangeQuerySchema,
  SleepDateQuerySchema,
} from './schema.js';

describe('MoodCreateInputSchema (§7.1)', () => {
  it('§7.1.1 accepts score=4, tags=[work,focus_high], note omitted', () => {
    const parsed = MoodCreateInputSchema.parse({
      score: 4,
      tags: ['work', 'focus_high'],
    });
    expect(parsed.score).toBe(4);
    expect(parsed.tags).toEqual(['work', 'focus_high']);
    expect(parsed.note).toBeUndefined();
  });

  it('§7.1.2 accepts note of 5 chars', () => {
    const parsed = MoodCreateInputSchema.parse({ score: 3, note: 'hello' });
    expect(parsed.note).toBe('hello');
  });

  it('§7.1.3 rejects unknown tag "xyz"', () => {
    expect(() =>
      MoodCreateInputSchema.parse({ score: 3, tags: ['xyz'] }),
    ).toThrow();
  });

  it('§7.1.4 rejects more than 8 tags', () => {
    expect(() =>
      MoodCreateInputSchema.parse({
        score: 3,
        tags: [
          'work',
          'study',
          'social',
          'isolation',
          'exercise',
          'walk',
          'sleep_well',
          'sleep_poor',
          'food', // 9th
        ],
      }),
    ).toThrow();
  });

  it('§7.1.5 rejects score=0 and score=6', () => {
    expect(() => MoodCreateInputSchema.parse({ score: 0 })).toThrow();
    expect(() => MoodCreateInputSchema.parse({ score: 6 })).toThrow();
  });

  it('§7.1.6 rejects valence=1.5 (range)', () => {
    expect(() =>
      MoodCreateInputSchema.parse({ score: 3, valence: 1.5 }),
    ).toThrow();
    expect(() =>
      MoodCreateInputSchema.parse({ score: 3, valence: -1.1 }),
    ).toThrow();
  });

  it('§7.1.12 accepts note of exactly 2000 chars, rejects 2001', () => {
    const okNote = 'a'.repeat(2000);
    const ngNote = 'a'.repeat(2001);
    expect(() =>
      MoodCreateInputSchema.parse({ score: 3, note: okNote }),
    ).not.toThrow();
    expect(() =>
      MoodCreateInputSchema.parse({ score: 3, note: ngNote }),
    ).toThrow();
  });

  it('source defaults to manual when omitted', () => {
    const parsed = MoodCreateInputSchema.parse({ score: 3 });
    expect(parsed.source).toBe('manual');
  });

  it('source accepts evening_dialog/morning_dialog', () => {
    expect(
      MoodCreateInputSchema.parse({ score: 3, source: 'evening_dialog' })
        .source,
    ).toBe('evening_dialog');
    expect(
      MoodCreateInputSchema.parse({ score: 3, source: 'morning_dialog' })
        .source,
    ).toBe('morning_dialog');
  });

  it('source rejects unknown value', () => {
    expect(() =>
      MoodCreateInputSchema.parse({ score: 3, source: 'unknown' }),
    ).toThrow();
  });
});

describe('SleepReportInputSchema (§7.2)', () => {
  it('§7.2.1 accepts valid date + wake_at + quality', () => {
    expect(() =>
      SleepReportInputSchema.parse({
        date: '2026-05-11',
        wake_at: '2026-05-11T07:30:00+09:00',
        quality: 4,
      }),
    ).not.toThrow();
  });

  it('§7.2.3 rejects date format "2026/05/11"', () => {
    expect(() =>
      SleepReportInputSchema.parse({ date: '2026/05/11', quality: 4 }),
    ).toThrow();
  });

  it('§7.2.4 rejects when all of bedtime_at/wake_at/quality omitted', () => {
    expect(() =>
      SleepReportInputSchema.parse({ date: '2026-05-11' }),
    ).toThrow();
  });

  it('§7.2.5 rejects quality=6', () => {
    expect(() =>
      SleepReportInputSchema.parse({ date: '2026-05-11', quality: 6 }),
    ).toThrow();
    expect(() =>
      SleepReportInputSchema.parse({ date: '2026-05-11', quality: 0 }),
    ).toThrow();
  });

  it('accepts when only quality is provided (refine passes)', () => {
    expect(() =>
      SleepReportInputSchema.parse({ date: '2026-05-11', quality: 3 }),
    ).not.toThrow();
  });

  it('accepts when only bedtime_at is provided', () => {
    expect(() =>
      SleepReportInputSchema.parse({
        date: '2026-05-11',
        bedtime_at: '2026-05-11T00:30:00+09:00',
      }),
    ).not.toThrow();
  });
});

describe('DialogStartInputSchema (§6.3)', () => {
  it('accepts morning/evening/talk', () => {
    expect(DialogStartInputSchema.parse({ mode: 'morning' }).mode).toBe(
      'morning',
    );
    expect(DialogStartInputSchema.parse({ mode: 'evening' }).mode).toBe(
      'evening',
    );
    expect(DialogStartInputSchema.parse({ mode: 'talk' }).mode).toBe('talk');
  });

  it('rejects unknown mode', () => {
    expect(() => DialogStartInputSchema.parse({ mode: 'nap' })).toThrow();
  });
});

describe('DialogTurnInputSchema (§6.3)', () => {
  it('accepts text of 1 char and 2000 chars', () => {
    expect(() => DialogTurnInputSchema.parse({ text: 'a' })).not.toThrow();
    expect(() =>
      DialogTurnInputSchema.parse({ text: 'a'.repeat(2000) }),
    ).not.toThrow();
  });

  it('rejects empty text and >2000 char text', () => {
    expect(() => DialogTurnInputSchema.parse({ text: '' })).toThrow();
    expect(() =>
      DialogTurnInputSchema.parse({ text: 'a'.repeat(2001) }),
    ).toThrow();
  });
});

describe('AccountDeleteInputSchema (§7.9.7-8)', () => {
  it('§7.9.7 accepts confirm: "DELETE" exactly', () => {
    expect(() =>
      AccountDeleteInputSchema.parse({ confirm: 'DELETE' }),
    ).not.toThrow();
  });

  it('§7.9.8 rejects confirm: "delete" (case-sensitive)', () => {
    expect(() =>
      AccountDeleteInputSchema.parse({ confirm: 'delete' }),
    ).toThrow();
    expect(() =>
      AccountDeleteInputSchema.parse({ confirm: 'Delete' }),
    ).toThrow();
  });
});

describe('MagicLinkRequestSchema (§7.10)', () => {
  it('§7.10.1 accepts valid email', () => {
    expect(() =>
      MagicLinkRequestSchema.parse({ email: 'touri1705@outlook.com' }),
    ).not.toThrow();
  });

  it('rejects invalid email format', () => {
    expect(() => MagicLinkRequestSchema.parse({ email: 'not-an-email' })).toThrow();
  });
});

describe('HistoryQuerySchema / MoodRangeQuerySchema / SleepDateQuerySchema (§7.13)', () => {
  it('§7.13.3 HistoryQuerySchema rejects bad date format', () => {
    expect(() => HistoryQuerySchema.parse({ date: '2026/05/11' })).toThrow();
  });

  it('§7.13.1 HistoryQuerySchema accepts YYYY-MM-DD', () => {
    expect(() => HistoryQuerySchema.parse({ date: '2026-05-11' })).not.toThrow();
  });

  it('§7.1.11 MoodRangeQuerySchema rejects from > to', () => {
    expect(() =>
      MoodRangeQuerySchema.parse({ from: '2026-05-12', to: '2026-05-01' }),
    ).toThrow();
  });

  it('§7.1.10 MoodRangeQuerySchema accepts from <= to', () => {
    expect(() =>
      MoodRangeQuerySchema.parse({ from: '2026-05-01', to: '2026-05-11' }),
    ).not.toThrow();
  });

  it('SleepDateQuerySchema accepts valid date', () => {
    expect(() => SleepDateQuerySchema.parse({ date: '2026-05-11' })).not.toThrow();
  });
});
