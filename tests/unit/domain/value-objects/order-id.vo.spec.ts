import { describe, expect, it } from 'vitest';
import { OrderId } from '@/domain/value-objects/order-id.vo';
import { InvalidValueObjectException } from '@/domain/exceptions';

describe('OrderId Value Object', () => {
  describe('generation', () => {
    it('should generate valid UUID order id', () => {
      const orderId = OrderId.generate();

      expect(orderId.value).toBeDefined();
      expect(typeof orderId.value).toBe('string');
      expect(orderId.value.length).toBeGreaterThan(0);
    });

    it('should generate unique order ids', () => {
      const id1 = OrderId.generate();
      const id2 = OrderId.generate();

      expect(id1.value).not.toBe(id2.value);
    });

    it('should generate valid UUID v4 format', () => {
      const orderId = OrderId.generate();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(orderId.value).toMatch(uuidRegex);
    });
  });

  describe('creation', () => {
    it('should create from valid string', () => {
      const id = OrderId.from('order-123');

      expect(id.value).toBe('order-123');
    });

    it('should create from UUID string', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = OrderId.from(uuid);

      expect(id.value).toBe(uuid);
    });

    it('should create from alphanumeric string', () => {
      const id = OrderId.from('ABC123XYZ789');

      expect(id.value).toBe('ABC123XYZ789');
    });

    it('should throw on empty string', () => {
      expect(() => OrderId.from('')).toThrow(InvalidValueObjectException);
    });

    it('should throw on whitespace only', () => {
      expect(() => OrderId.from('   ')).toThrow(InvalidValueObjectException);
    });

    it('should throw on null', () => {
      expect(() => OrderId.from(null as any)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on undefined', () => {
      expect(() => OrderId.from(undefined as any)).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('comparison', () => {
    it('should equal same id', () => {
      const id1 = OrderId.from('order-123');
      const id2 = OrderId.from('order-123');

      expect(id1.equals(id2)).toBe(true);
    });

    it('should not equal different id', () => {
      const id1 = OrderId.from('order-123');
      const id2 = OrderId.from('order-456');

      expect(id1.equals(id2)).toBe(false);
    });

    it('should be case sensitive', () => {
      const id1 = OrderId.from('ORDER-123');
      const id2 = OrderId.from('order-123');

      expect(id1.equals(id2)).toBe(false);
    });

    it('should not equal generated ids', () => {
      const id1 = OrderId.generate();
      const id2 = OrderId.generate();

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      const id = OrderId.from('order-123');

      expect(id.toString()).toBe('order-123');
    });

    it('should serialize to JSON', () => {
      const id = OrderId.from('order-123');
      const json = id.toJSON();

      expect(json).toBe('order-123');
    });

    it('should serialize generated UUID to JSON', () => {
      const id = OrderId.generate();
      const json = id.toJSON();

      expect(typeof json).toBe('string');
      expect(json).toBe(id.value);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const id = OrderId.from('order-123');

      expect(() => {
        (id as any).value = 'modified';
      }).toThrow();
    });
  });
});
