import { describe, expect, it } from 'vitest';
import { Quantity } from '@/domain/value-objects/quantity.vo';
import { InvalidValueObjectException, InvalidOperationException } from '@/domain/exceptions';

describe('Quantity Value Object', () => {
  describe('creation', () => {
    it('should create valid quantity', () => {
      const qty = Quantity.from(10);

      expect(qty.value).toBe(10);
    });

    it('should create zero quantity', () => {
      const qty = Quantity.from(0);

      expect(qty.value).toBe(0);
    });

    it('should create decimal quantity', () => {
      const qty = Quantity.from(5.5);

      expect(qty.value).toBe(5.5);
    });

    it('should throw on negative value', () => {
      expect(() => Quantity.from(-1)).toThrow(InvalidValueObjectException);
    });

    it('should throw on infinite value', () => {
      expect(() => Quantity.from(Infinity)).toThrow(InvalidValueObjectException);
    });

    it('should throw on NaN value', () => {
      expect(() => Quantity.from(NaN)).toThrow(InvalidValueObjectException);
    });
  });

  describe('factory methods', () => {
    it('should create zero quantity', () => {
      const qty = Quantity.zero();

      expect(qty.value).toBe(0);
    });

    it('should create one quantity', () => {
      const qty = Quantity.one();

      expect(qty.value).toBe(1);
    });
  });

  describe('arithmetic', () => {
    it('should add quantities', () => {
      const qty1 = Quantity.from(5);
      const qty2 = Quantity.from(3);

      const result = qty1.add(qty2);

      expect(result.value).toBe(8);
    });

    it('should add decimal quantities', () => {
      const qty1 = Quantity.from(5.5);
      const qty2 = Quantity.from(2.3);

      const result = qty1.add(qty2);

      expect(result.value).toBeCloseTo(7.8, 10);
    });

    it('should subtract quantities', () => {
      const qty1 = Quantity.from(5);
      const qty2 = Quantity.from(3);

      const result = qty1.subtract(qty2);

      expect(result.value).toBe(2);
    });

    it('should subtract to zero', () => {
      const qty1 = Quantity.from(5);
      const qty2 = Quantity.from(5);

      const result = qty1.subtract(qty2);

      expect(result.value).toBe(0);
    });

    it('should throw when subtract would result in negative', () => {
      const qty1 = Quantity.from(3);
      const qty2 = Quantity.from(5);

      expect(() => qty1.subtract(qty2)).toThrow(InvalidOperationException);
    });

    it('should multiply by factor', () => {
      const qty = Quantity.from(5);

      const result = qty.multiply(3);

      expect(result.value).toBe(15);
    });

    it('should multiply by decimal factor', () => {
      const qty = Quantity.from(10);

      const result = qty.multiply(0.5);

      expect(result.value).toBe(5);
    });

    it('should multiply by zero', () => {
      const qty = Quantity.from(10);

      const result = qty.multiply(0);

      expect(result.value).toBe(0);
    });

    it('should throw when multiply by negative factor', () => {
      const qty = Quantity.from(5);

      expect(() => qty.multiply(-2)).toThrow(InvalidOperationException);
    });

    it('should throw when multiply by infinite', () => {
      const qty = Quantity.from(5);

      expect(() => qty.multiply(Infinity)).toThrow(InvalidOperationException);
    });

    it('should throw when multiply by NaN', () => {
      const qty = Quantity.from(5);

      expect(() => qty.multiply(NaN)).toThrow(InvalidOperationException);
    });

    it('should divide by divisor', () => {
      const qty = Quantity.from(10);

      const result = qty.divide(2);

      expect(result.value).toBe(5);
    });

    it('should divide to decimal', () => {
      const qty = Quantity.from(10);

      const result = qty.divide(3);

      expect(result.value).toBeCloseTo(3.333, 3);
    });

    it('should throw when divide by zero', () => {
      const qty = Quantity.from(10);

      expect(() => qty.divide(0)).toThrow(InvalidOperationException);
    });

    it('should throw when divide by negative', () => {
      const qty = Quantity.from(10);

      expect(() => qty.divide(-2)).toThrow(InvalidOperationException);
    });

    it('should throw when divide by infinite', () => {
      const qty = Quantity.from(10);

      expect(() => qty.divide(Infinity)).toThrow(InvalidOperationException);
    });

    it('should throw when divide by NaN', () => {
      const qty = Quantity.from(10);

      expect(() => qty.divide(NaN)).toThrow(InvalidOperationException);
    });
  });

  describe('comparison', () => {
    it('should identify zero', () => {
      const qty = Quantity.zero();

      expect(qty.isZero()).toBe(true);
    });

    it('should identify non-zero', () => {
      const qty = Quantity.from(1);

      expect(qty.isZero()).toBe(false);
    });

    it('should identify positive', () => {
      const qty = Quantity.from(10);

      expect(qty.isPositive()).toBe(true);
    });

    it('should identify zero as not positive', () => {
      const qty = Quantity.zero();

      expect(qty.isPositive()).toBe(false);
    });

    it('should compare greater than', () => {
      const qty1 = Quantity.from(10);
      const qty2 = Quantity.from(5);

      expect(qty1.greaterThan(qty2)).toBe(true);
      expect(qty2.greaterThan(qty1)).toBe(false);
    });

    it('should compare greater than or equal', () => {
      const qty1 = Quantity.from(10);
      const qty2 = Quantity.from(10);
      const qty3 = Quantity.from(5);

      expect(qty1.greaterThanOrEqual(qty2)).toBe(true);
      expect(qty1.greaterThanOrEqual(qty3)).toBe(true);
      expect(qty3.greaterThanOrEqual(qty1)).toBe(false);
    });

    it('should compare less than', () => {
      const qty1 = Quantity.from(5);
      const qty2 = Quantity.from(10);

      expect(qty1.lessThan(qty2)).toBe(true);
      expect(qty2.lessThan(qty1)).toBe(false);
    });

    it('should compare less than or equal', () => {
      const qty1 = Quantity.from(5);
      const qty2 = Quantity.from(5);
      const qty3 = Quantity.from(10);

      expect(qty1.lessThanOrEqual(qty2)).toBe(true);
      expect(qty1.lessThanOrEqual(qty3)).toBe(true);
      expect(qty3.lessThanOrEqual(qty1)).toBe(false);
    });

    it('should check equality', () => {
      const qty1 = Quantity.from(10);
      const qty2 = Quantity.from(10);
      const qty3 = Quantity.from(5);

      expect(qty1.equals(qty2)).toBe(true);
      expect(qty1.equals(qty3)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      const qty = Quantity.from(10);

      expect(qty.toString()).toBe('10');
    });

    it('should convert decimal to string', () => {
      const qty = Quantity.from(10.5);

      expect(qty.toString()).toBe('10.5');
    });

    it('should serialize to JSON', () => {
      const qty = Quantity.from(10);

      expect(qty.toJSON()).toBe(10);
    });

    it('should serialize decimal to JSON', () => {
      const qty = Quantity.from(10.5);

      expect(qty.toJSON()).toBe(10.5);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const qty = Quantity.from(10);

      expect(() => {
        (qty as any).value = 20;
      }).toThrow();
    });
  });
});
