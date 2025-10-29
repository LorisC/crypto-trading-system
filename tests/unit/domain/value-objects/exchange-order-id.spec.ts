import { describe, expect, it } from 'vitest';
import { ExchangeOrderId } from '@/domain/value-objects/exchange-order-id';
import { InvalidValueObjectException } from '@/domain/exceptions';

describe('ExchangeOrderId Value Object', () => {
  describe('creation', () => {
    it('should create valid exchange order id', () => {
      const id = ExchangeOrderId.from('123456789');

      expect(id.value).toBe('123456789');
    });

    it('should create with numeric string', () => {
      const id = ExchangeOrderId.from('999888777666');

      expect(id.value).toBe('999888777666');
    });

    it('should create with alphanumeric string', () => {
      const id = ExchangeOrderId.from('ABC123XYZ789');

      expect(id.value).toBe('ABC123XYZ789');
    });

    it('should create with special characters', () => {
      const id = ExchangeOrderId.from('order-123_abc');

      expect(id.value).toBe('order-123_abc');
    });

    it('should throw on empty string', () => {
      expect(() => ExchangeOrderId.from('')).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on whitespace only', () => {
      expect(() => ExchangeOrderId.from('   ')).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on null', () => {
      expect(() => ExchangeOrderId.from(null as any)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on undefined', () => {
      expect(() => ExchangeOrderId.from(undefined as any)).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('comparison', () => {
    it('should equal same id', () => {
      const id1 = ExchangeOrderId.from('123456');
      const id2 = ExchangeOrderId.from('123456');

      expect(id1.equals(id2)).toBe(true);
    });

    it('should not equal different id', () => {
      const id1 = ExchangeOrderId.from('123456');
      const id2 = ExchangeOrderId.from('789012');

      expect(id1.equals(id2)).toBe(false);
    });

    it('should be case sensitive', () => {
      const id1 = ExchangeOrderId.from('ABC123');
      const id2 = ExchangeOrderId.from('abc123');

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      const id = ExchangeOrderId.from('123456789');

      expect(id.toString()).toBe('123456789');
    });

    it('should serialize to JSON', () => {
      const id = ExchangeOrderId.from('123456789');
      const json = id.toJSON();

      expect(json).toBe('123456789');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const id = ExchangeOrderId.from('123456');

      expect(() => {
        (id as any).value = 'modified';
      }).toThrow();
    });
  });
});
