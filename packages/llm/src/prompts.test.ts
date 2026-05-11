import { describe, expect, it } from 'vitest';
import type { DialogSummary } from '@tomori/shared';

import { buildContext } from './prompts.js';

type BuildContextInput = Parameters<typeof buildContext>[0];

const pad2 = (value: number) => String(value).padStart(2, '0');

const makeSummary = (index: number): DialogSummary => ({
  date: `2026-05-${pad2(index + 1)}`,
  mode: 'talk',
  sentiment_score: index + 0.1,
  top_emotions: [`emotion_${pad2(index)}`],
  key_events: [`summary_event_${pad2(index)}`],
  insights: `insight_${pad2(index)}`,
  unresolved_concerns: `concern_${pad2(index)}`,
  action_item_tomorrow: `action_${pad2(index)}`,
  turn_count: index + 1,
  closed_by: 'turn_cap',
});

const makeTurn = (index: number): { role: 'user' | 'assistant'; text: string } => ({
  role: index % 2 === 0 ? 'user' : 'assistant',
  text: `short_turn_${pad2(index)}`,
});

describe('buildContext (§7.7)', () => {
  it('§7.7.3 returns a single user-role payload with all 3 sections present even when empty', () => {
    const result = buildContext({ recentTurns: [], recentSummaries: [] });

    expect(result.role).toBe('user');
    expect(result.content).toContain('## 直近のサマリー');
    expect(result.content).toContain('## 直近の対話片');
    expect(result.content).toContain('## 今日の睡眠/気分');
    expect(result.content).toMatch(
      /## 直近のサマリー[\s\S]*## 直近の対話片[\s\S]*## 今日の睡眠\/気分/,
    );
  });

  it('§7.7.1 caps recentTurns to at most 30 entries (drop mechanism works)', () => {
    const recentTurns = Array.from({ length: 32 }, (_, index) =>
      makeTurn(index),
    ) as unknown as BuildContextInput['recentTurns'];
    const result = buildContext({ recentTurns, recentSummaries: [] });

    const matched = result.content
      .split('\n')
      .filter((line) => /short_turn_\d{2}/.test(line));
    expect(matched.length).toBeLessThanOrEqual(30);
    expect(matched.length).toBeGreaterThan(0);
  });

  it('§7.7.2 caps recentSummaries to at most 14 entries (drop mechanism works)', () => {
    const recentSummaries = Array.from({ length: 16 }, (_, index) =>
      makeSummary(index),
    );
    const result = buildContext({ recentTurns: [], recentSummaries });

    const matched = result.content
      .split('\n')
      .filter((line) => /summary_event_\d{2}/.test(line));
    expect(matched.length).toBeLessThanOrEqual(14);
    expect(matched.length).toBeGreaterThan(0);
  });

  it('§7.7.4 Mid/Short ともに 0 件でも空セクションを出力する', () => {
    const result = buildContext({ recentTurns: [], recentSummaries: [] });
    expect(result.content).toContain('## 直近のサマリー');
    expect(result.content).toContain('## 直近の対話片');
    expect(result.content).toContain('## 今日の睡眠/気分');
  });

  it('§7.7.5/7.7.6 maskPII is applied to user-turn text in the context output', () => {
    const recentTurns = [
      {
        role: 'user' as const,
        text: 'メールは user@example.com で電話は 090-1111-2222 です',
      },
    ] as unknown as BuildContextInput['recentTurns'];
    const result = buildContext({ recentTurns, recentSummaries: [] });

    expect(result.content).toContain('[EMAIL]');
    expect(result.content).toContain('[TEL]');
    expect(result.content).not.toContain('user@example.com');
    expect(result.content).not.toContain('090-1111-2222');
  });

  it('§7.7.6 assistant 発話はマスクしない (assistant の発話には PII が残る)', () => {
    const recentTurns = [
      {
        role: 'assistant' as const,
        text: 'お返事は agent@example.com まで 090-3333-4444',
      },
    ] as unknown as BuildContextInput['recentTurns'];
    const result = buildContext({ recentTurns, recentSummaries: [] });

    // assistant 発話の PII はそのまま残ることを仕様化
    expect(result.content).toContain('agent@example.com');
    expect(result.content).toContain('090-3333-4444');
  });
});
