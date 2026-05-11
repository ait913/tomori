import { describe, expect, it } from 'vitest';

import { maskPII } from './maskPII.js';

describe('maskPII', () => {
  it('returns an empty string for undefined', () => {
    expect(maskPII(undefined)).toBe('');
  });

  it('returns an empty string for null', () => {
    expect(maskPII(null)).toBe('');
  });

  it('returns an empty string for an empty input', () => {
    expect(maskPII('')).toBe('');
  });

  it('masks a half-width email address', () => {
    expect(maskPII('連絡先は abc@example.com です')).toBe('連絡先は [EMAIL] です');
  });

  it('masks a half-width telephone number', () => {
    expect(maskPII('090-1234-5678 まで')).toBe('[TEL] まで');
  });

  it('masks multiple telephone numbers in one string', () => {
    expect(maskPII('03-1234-5678 と 080-0000-0000')).toBe('[TEL] と [TEL]');
  });

  it('masks a contiguous credit card number', () => {
    expect(maskPII('カード 4242424242424242 を使った')).toBe('カード [CC] を使った');
  });

  it('does not mask a full-width credit card number', () => {
    expect(maskPII('４２４２４２４２４２４２４２４２')).toBe('４２４２４２４２４２４２４２４２');
  });

  it('masks multiple email addresses in one string', () => {
    expect(maskPII('a@b.co と c@d.co')).toBe('[EMAIL] と [EMAIL]');
  });

  it('keeps an existing email mask unchanged', () => {
    expect(maskPII('連絡先 [EMAIL] です')).toBe('連絡先 [EMAIL] です');
  });

  it('keeps a URL unchanged', () => {
    expect(maskPII('https://example.com/path?a=1')).toBe('https://example.com/path?a=1');
  });

  it('keeps a non-matching email-like string unchanged', () => {
    expect(maskPII('not-an-email-@-x')).toBe('not-an-email-@-x');
  });

  it('masks a telephone number without hyphens', () => {
    expect(maskPII('0312345678')).toBe('[TEL]');
  });

  it('does not mask a non-luhn number', () => {
    expect(maskPII('1234567890123')).toBe('1234567890123');
  });

  it('masks a space-delimited credit card number', () => {
    expect(maskPII('4242 4242 4242 4242')).toBe('[CC]');
  });

  it('does not mask a full-width telephone number', () => {
    expect(maskPII('０９０－１２３４－５６７８')).toBe('０９０－１２３４－５６７８');
  });
});
