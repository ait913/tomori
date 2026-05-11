import { describe, it, expect } from 'vitest';
import { AppError } from './error.js';

// 設計 §6.2 共通レスポンス形式 / §16.2-8 error code は §6.2 のテーブル通り
describe('AppError (§6.2 error code table)', () => {
  it('stores status, code, message, and optional details', () => {
    const err = new AppError(401, 'UNAUTHORIZED', 'session invalid');
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('session invalid');
    expect(err.details).toBeUndefined();
  });

  it('preserves details when provided', () => {
    const err = new AppError(400, 'VALIDATION_FAILED', 'bad input', {
      field: 'score',
    });
    expect(err.details).toEqual({ field: 'score' });
  });

  it('is an instance of Error', () => {
    const err = new AppError(500, 'INTERNAL', 'boom');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('§6.2 supports UNAUTHORIZED at 401', () => {
    const err = new AppError(401, 'UNAUTHORIZED', '');
    expect(err.status).toBe(401);
  });

  it('§6.2 supports FORBIDDEN at 403', () => {
    const err = new AppError(403, 'FORBIDDEN', '');
    expect(err.status).toBe(403);
  });

  it('§6.2 supports CRISIS_HANDOFF at 409', () => {
    const err = new AppError(409, 'CRISIS_HANDOFF', '');
    expect(err.code).toBe('CRISIS_HANDOFF');
  });

  it('§6.2 supports TURN_CAP_REACHED at 409', () => {
    const err = new AppError(409, 'TURN_CAP_REACHED', '');
    expect(err.code).toBe('TURN_CAP_REACHED');
  });

  it('§6.2 supports SESSION_CLOSED at 409', () => {
    const err = new AppError(409, 'SESSION_CLOSED', '');
    expect(err.code).toBe('SESSION_CLOSED');
  });

  it('§6.2 supports RATE_LIMITED at 429', () => {
    const err = new AppError(429, 'RATE_LIMITED', '');
    expect(err.status).toBe(429);
  });

  it('§6.2 supports LLM_TIMEOUT at 504', () => {
    const err = new AppError(504, 'LLM_TIMEOUT', '');
    expect(err.status).toBe(504);
  });
});
