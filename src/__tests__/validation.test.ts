import { describe, it, expect } from 'vitest';
import { validateDepth, validateServiceId, validatePathParams } from '@/lib/validation';

describe('validateDepth', () => {
  it('accepts 1, 2, 3', () => {
    expect(validateDepth('1')).toBe(1);
    expect(validateDepth('2')).toBe(2);
    expect(validateDepth('3')).toBe(3);
  });

  it('defaults to 1 when null', () => {
    expect(validateDepth(null)).toBe(1);
  });

  it('rejects 0', () => {
    expect(() => validateDepth('0')).toThrow();
  });

  it('rejects 4', () => {
    expect(() => validateDepth('4')).toThrow();
  });

  it('rejects -1', () => {
    expect(() => validateDepth('-1')).toThrow();
  });

  it('rejects non-numeric string', () => {
    expect(() => validateDepth('abc')).toThrow();
  });
});

describe('validateServiceId', () => {
  it('accepts a valid id', () => {
    expect(validateServiceId('payment-service')).toBe('payment-service');
  });

  it('trims whitespace', () => {
    expect(validateServiceId('  api-gateway  ')).toBe('api-gateway');
  });

  it('rejects empty string', () => {
    expect(() => validateServiceId('')).toThrow();
  });

  it('rejects null', () => {
    expect(() => validateServiceId(null)).toThrow();
  });

  it('rejects undefined', () => {
    expect(() => validateServiceId(undefined)).toThrow();
  });
});

describe('validatePathParams', () => {
  it('accepts both from and to', () => {
    const result = validatePathParams('checkout-service', 'payment-service');
    expect(result).toEqual({ from: 'checkout-service', to: 'payment-service' });
  });

  it('rejects missing from', () => {
    expect(() => validatePathParams(null, 'payment-service')).toThrow();
  });

  it('rejects missing to', () => {
    expect(() => validatePathParams('checkout-service', null)).toThrow();
  });

  it('rejects both missing', () => {
    expect(() => validatePathParams(null, null)).toThrow();
  });

  it('rejects empty string from', () => {
    expect(() => validatePathParams('', 'payment-service')).toThrow();
  });
});
