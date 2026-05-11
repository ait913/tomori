import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadCrisisCardFromEnv } from './card.js';

const savedEnv = { ...process.env };

beforeEach(() => {
  process.env.TOMORI_CRISIS_HOTLINES_JSON = JSON.stringify({
    title: '今、安全が心配です',
    message: '話せる相手と話すことを優先してほしい。',
    hotlines: [
      { label: 'よりそいホットライン', tel: '0120-279-338' },
      { label: 'いのちの電話', tel: '0570-783-556' },
      { label: '警察', tel: '110' },
      { label: '救急', tel: '119' },
    ],
  });
});

afterEach(() => {
  process.env = { ...savedEnv };
});

describe('loadCrisisCardFromEnv (§11.1)', () => {
  it('§11.1 parses the JSON envelope and returns a CrisisCard', () => {
    const card = loadCrisisCardFromEnv();
    expect(card.title).toBe('今、安全が心配です');
    expect(card.hotlines).toHaveLength(4);
    expect(card.hotlines[0]!.tel).toBe('0120-279-338');
  });

  it('§11.1 throws when env var is missing', () => {
    delete process.env.TOMORI_CRISIS_HOTLINES_JSON;
    expect(() => loadCrisisCardFromEnv()).toThrow();
  });

  it('§11.1 throws when JSON is invalid', () => {
    process.env.TOMORI_CRISIS_HOTLINES_JSON = '{not valid';
    expect(() => loadCrisisCardFromEnv()).toThrow();
  });

  it('§11.1 throws when hotlines is empty array (zod schema reject)', () => {
    process.env.TOMORI_CRISIS_HOTLINES_JSON = JSON.stringify({
      title: 't',
      message: 'm',
      hotlines: [],
    });
    expect(() => loadCrisisCardFromEnv()).toThrow();
  });

  it('§11.1 throws when a hotline is missing tel', () => {
    process.env.TOMORI_CRISIS_HOTLINES_JSON = JSON.stringify({
      title: 't',
      message: 'm',
      hotlines: [{ label: 'broken' }],
    });
    expect(() => loadCrisisCardFromEnv()).toThrow();
  });
});
