import { describe, expect, it } from 'vitest';
import { Percentage } from '@/domain/value-objects/percentage.vo';
import { InvalidValueObjectException, InvalidOperationException } from '@/domain/exceptions';

describe('Percentage Value Object', () => {
  describe('creation', () => {
    it('should create valid percentage', () => {
      const pct = Percentage.from(50);

      expect(pct.value).toBe(50);
    });

    it('should create zero percentage', () => {
      const pct = Percentage.from(0);

      expect(pct.value).toBe(0);
    });

    it('should create negative percentage', () => {
      const pct = Percentage.from(-10);

      expect(pct.value).toBe(-10);
    });

    it('should create percentage with decimals', () => {
      const pct = Percentage.from(0.5);

      expect(pct.value).toBe(0.5);
    });

    it('should create percentage at boundary -100', () => {
      const pct = Percentage.from(-100);

      expect(pct.value).toBe(-100);
    });

    it('should create percentage at boundary 100', () => {
      const pct = Percentage.from(100);

      expect(pct.value).toBe(100);
    });

    it('should throw on less than -100', () => {
      expect(() => Percentage.from(-101)).toThrow(InvalidValueObjectException);
    });

    it('should throw on greater than 100 without allowAbove100', () => {
      expect(() => Percentage.from(101)).toThrow(InvalidValueObjectException);
    });

    it('should allow greater than 100 with allowAbove100 option', () => {
      const pct = Percentage.from(150, { allowAbove100: true });

      expect(pct.value).toBe(150);
    });

    it('should throw on infinite value', () => {
      expect(() => Percentage.from(Infinity)).toThrow(InvalidValueObjectException);
    });

    it('should throw on NaN value', () => {
      expect(() => Percentage.from(NaN)).toThrow(InvalidValueObjectException);
    });
  });

  describe('factory methods', () => {
    it('should create zero percentage', () => {
      const pct = Percentage.zero();

      expect(pct.value).toBe(0);
    });

    it('should create from ratio', () => {
      const pct = Percentage.fromRatio(0.5);

      expect(pct.value).toBe(50);
    });

    it('should create from ratio greater than 1', () => {
      const pct = Percentage.fromRatio(1.5);

      expect(pct.value).toBe(150);
    });

    it('should create from ratio of 0', () => {
      const pct = Percentage.fromRatio(0);

      expect(pct.value).toBe(0);
    });

    it('should create from basis points', () => {
      const pct = Percentage.fromBasisPoints(50);

      expect(pct.value).toBe(0.5);
    });

    it('should create from 100 basis points', () => {
      const pct = Percentage.fromBasisPoints(100);

      expect(pct.value).toBe(1);
    });

    it('should create from 0 basis points', () => {
      const pct = Percentage.fromBasisPoints(0);

      expect(pct.value).toBe(0);
    });
  });

  describe('conversions', () => {
    it('should convert to ratio', () => {
      const pct = Percentage.from(50);

      expect(pct.toRatio()).toBe(0.5);
    });

    it('should convert 100% to ratio 1', () => {
      const pct = Percentage.from(100);

      expect(pct.toRatio()).toBe(1);
    });

    it('should convert 0% to ratio 0', () => {
      const pct = Percentage.from(0);

      expect(pct.toRatio()).toBe(0);
    });

    it('should convert negative percentage to ratio', () => {
      const pct = Percentage.from(-10);

      expect(pct.toRatio()).toBe(-0.1);
    });

    it('should convert to basis points', () => {
      const pct = Percentage.from(0.5);

      expect(pct.toBasisPoints()).toBe(50);
    });

    it('should convert 1% to 100 basis points', () => {
      const pct = Percentage.from(1);

      expect(pct.toBasisPoints()).toBe(100);
    });

    it('should convert 0% to 0 basis points', () => {
      const pct = Percentage.from(0);

      expect(pct.toBasisPoints()).toBe(0);
    });
  });

  describe('arithmetic', () => {
    it('should add percentages', () => {
      const pct1 = Percentage.from(30);
      const pct2 = Percentage.from(20);

      const result = pct1.add(pct2);

      expect(result.value).toBe(50);
    });

    it('should add percentages exceeding 100', () => {
      const pct1 = Percentage.from(60);
      const pct2 = Percentage.from(50);

      const result = pct1.add(pct2);

      expect(result.value).toBe(110);
    });

    it('should subtract percentages', () => {
      const pct1 = Percentage.from(50);
      const pct2 = Percentage.from(20);

      const result = pct1.subtract(pct2);

      expect(result.value).toBe(30);
    });

    it('should subtract to negative', () => {
      const pct1 = Percentage.from(20);
      const pct2 = Percentage.from(50);

      const result = pct1.subtract(pct2);

      expect(result.value).toBe(-30);
    });

    it('should multiply by factor', () => {
      const pct = Percentage.from(50);

      const result = pct.multiply(2);

      expect(result.value).toBe(100);
    });

    it('should multiply by decimal factor', () => {
      const pct = Percentage.from(50);

      const result = pct.multiply(0.5);

      expect(result.value).toBe(25);
    });

    it('should multiply to exceed 100%', () => {
      const pct = Percentage.from(50);

      const result = pct.multiply(3);

      expect(result.value).toBe(150);
    });

    it('should throw on multiply by infinite', () => {
      const pct = Percentage.from(50);

      expect(() => pct.multiply(Infinity)).toThrow(InvalidOperationException);
    });

    it('should throw on multiply by NaN', () => {
      const pct = Percentage.from(50);

      expect(() => pct.multiply(NaN)).toThrow(InvalidOperationException);
    });
  });

  describe('comparison', () => {
    it('should identify zero', () => {
      const pct = Percentage.from(0);

      expect(pct.isZero()).toBe(true);
    });

    it('should identify non-zero', () => {
      const pct = Percentage.from(1);

      expect(pct.isZero()).toBe(false);
    });

    it('should identify positive', () => {
      const pct = Percentage.from(10);

      expect(pct.isPositive()).toBe(true);
      expect(pct.isNegative()).toBe(false);
    });

    it('should identify negative', () => {
      const pct = Percentage.from(-10);

      expect(pct.isNegative()).toBe(true);
      expect(pct.isPositive()).toBe(false);
    });

    it('should compare greater than', () => {
      const pct1 = Percentage.from(50);
      const pct2 = Percentage.from(30);

      expect(pct1.greaterThan(pct2)).toBe(true);
      expect(pct2.greaterThan(pct1)).toBe(false);
    });

    it('should compare greater than or equal', () => {
      const pct1 = Percentage.from(50);
      const pct2 = Percentage.from(50);
      const pct3 = Percentage.from(30);

      expect(pct1.greaterThanOrEqual(pct2)).toBe(true);
      expect(pct1.greaterThanOrEqual(pct3)).toBe(true);
      expect(pct3.greaterThanOrEqual(pct1)).toBe(false);
    });

    it('should compare less than', () => {
      const pct1 = Percentage.from(30);
      const pct2 = Percentage.from(50);

      expect(pct1.lessThan(pct2)).toBe(true);
      expect(pct2.lessThan(pct1)).toBe(false);
    });

    it('should compare less than or equal', () => {
      const pct1 = Percentage.from(30);
      const pct2 = Percentage.from(30);
      const pct3 = Percentage.from(50);

      expect(pct1.lessThanOrEqual(pct2)).toBe(true);
      expect(pct1.lessThanOrEqual(pct3)).toBe(true);
      expect(pct3.lessThanOrEqual(pct1)).toBe(false);
    });

    it('should check equality', () => {
      const pct1 = Percentage.from(50);
      const pct2 = Percentage.from(50);
      const pct3 = Percentage.from(30);

      expect(pct1.equals(pct2)).toBe(true);
      expect(pct1.equals(pct3)).toBe(false);
    });
  });

  describe('formatting', () => {
    it('should format with default decimals', () => {
      const pct = Percentage.from(50.123);

      expect(pct.format()).toBe('50.12%');
    });

    it('should format with custom decimals', () => {
      const pct = Percentage.from(50.12345);

      expect(pct.format(4)).toBe('50.1235%');
    });

    it('should format zero decimals', () => {
      const pct = Percentage.from(50.8);

      expect(pct.format(0)).toBe('51%');
    });

    it('should format negative percentage', () => {
      const pct = Percentage.from(-10.5);

      expect(pct.format()).toBe('-10.50%');
    });

    it('should convert to string', () => {
      const pct = Percentage.from(50);

      expect(pct.toString()).toBe('50.00%');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const pct = Percentage.from(50);

      expect(pct.toJSON()).toBe(50);
    });

    it('should serialize decimal value', () => {
      const pct = Percentage.from(50.5);

      expect(pct.toJSON()).toBe(50.5);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const pct = Percentage.from(50);

      expect(() => {
        (pct as any).value = 100;
      }).toThrow();
    });
  });
});
