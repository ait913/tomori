import { describe, expect, it } from 'vitest';

import { detectCrisisRegex } from './detect.js';

const expectRegexHit = (text: string, patternId: string) => {
  const result = detectCrisisRegex(text);

  expect(result.hit).toBe(true);
  expect(result.by).toBe('regex');
  expect(result.matched).toContain(patternId);
};

const expectNoRegexHit = (text: string) => {
  const result = detectCrisisRegex(text);

  expect(result.hit).toBe(false);
  expect(result.by).toBe('none');
};

describe('detectCrisisRegex', () => {
  it('hits suicide_direct for 死にたい', () => {
    expectRegexHit('死にたい', 'suicide_direct');
  });

  it('hits suicide_method for リスカ', () => {
    expectRegexHit('リスカ', 'suicide_method');
  });

  it('does not hit for リスト　カット with a normalized internal space', () => {
    expectNoRegexHit('リスト　カット');
  });

  it('does not hit for 今日は死ぬほど忙しい', () => {
    expectNoRegexHit('今日は死ぬほど忙しい');
  });

  it('does not hit for the model-only crisis marker token', () => {
    expectNoRegexHit('[CRISIS_DETECTED_BY_MODEL]');
  });

  it('hits self_harm for 自傷', () => {
    expectRegexHit('自傷してしまいそう', 'self_harm');
  });

  it('does not hit self_harm for a benign sentence', () => {
    expectNoRegexHit('今日は散歩して気分転換した');
  });

  it('hits harm_others for 殺してやる', () => {
    expectRegexHit('殺してやる', 'harm_others');
  });

  it('does not hit harm_others for irritation without violent wording', () => {
    expectNoRegexHit('イライラするけど落ち着きたい');
  });

  it('hits abuse_victim for 親に虐待', () => {
    expectRegexHit('親に虐待されている', 'abuse_victim');
  });

  it('does not hit abuse_victim for ordinary scolding', () => {
    expectNoRegexHit('親に叱られて落ち込んだ');
  });

  it('hits suicide_method for uppercase OD with word boundaries', () => {
    expectRegexHit('今日は OD ちょっと不安', 'suicide_method');
  });

  it('hits suicide_method for lowercase od after normalization', () => {
    expectRegexHit('今日は od ちょっと不安', 'suicide_method');
  });

  it('does not hit for OD appearing inside other words', () => {
    expectNoRegexHit('CODE や GOOD の話をしている');
  });
});
