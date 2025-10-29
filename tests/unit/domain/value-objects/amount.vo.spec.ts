import { describe, expect, it } from 'vitest';
import { Amount } from '@/domain/value-objects/amount.vo';
import { Asset } from '@/domain/value-objects/asset.vo';
import {
  InvalidValueObjectException,
  InvalidOperationException,
} from '@/domain/exceptions';
import { AssetType } from '@domain/enum';

describe('Amount Value Object', () => {
  const btc = Asset.from('BTC', AssetType.CRYPTOCURRENCY);
  const usdt = Asset.from('USDT', AssetType.STABLECOIN);
  const eth = Asset.from('ETH', AssetType.CRYPTOCURRENCY);

  describe('creation', () => {
    it('should create valid amount from number', () => {
      const amount = Amount.from(100, btc);

      expect(amount.value).toBe(100);
      expect(amount.asset.equals(btc)).toBe(true);
    });

    it('should create valid amount from string', () => {
      const amount = Amount.from('100.5', btc);

      expect(amount.value).toBe(100.5);
      expect(amount.asset.equals(btc)).toBe(true);
    });

    it('should create zero amount', () => {
      const amount = Amount.zero(btc);

      expect(amount.value).toBe(0);
      expect(amount.asset.equals(btc)).toBe(true);
    });

    it('should handle decimal amounts', () => {
      const amount = Amount.from(0.00001, btc);

      expect(amount.value).toBe(0.00001);
    });

    it('should handle negative amounts', () => {
      const amount = Amount.from(-100, usdt);

      expect(amount.value).toBe(-100);
    });

    it('should throw on infinite value', () => {
      expect(() => Amount.from(Infinity, btc)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on NaN value', () => {
      expect(() => Amount.from(NaN, btc)).toThrow(InvalidValueObjectException);
    });
  });

  describe('arithmetic - add', () => {
    it('should add two amounts of same asset', () => {
      const amount1 = Amount.from(100, btc);
      const amount2 = Amount.from(50, btc);

      const result = amount1.add(amount2);

      expect(result.value).toBe(150);
      expect(result.asset.equals(btc)).toBe(true);
    });

    it('should add zero', () => {
      const amount = Amount.from(100, btc);
      const zero = Amount.zero(btc);

      const result = amount.add(zero);

      expect(result.value).toBe(100);
    });

    it('should throw when adding different assets', () => {
      const btcAmount = Amount.from(100, btc);
      const ethAmount = Amount.from(50, eth);

      expect(() => btcAmount.add(ethAmount)).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('arithmetic - subtract', () => {
    it('should subtract two amounts of same asset', () => {
      const amount1 = Amount.from(100, btc);
      const amount2 = Amount.from(30, btc);

      const result = amount1.subtract(amount2);

      expect(result.value).toBe(70);
      expect(result.asset.equals(btc)).toBe(true);
    });

    it('should allow negative result', () => {
      const amount1 = Amount.from(30, btc);
      const amount2 = Amount.from(100, btc);

      const result = amount1.subtract(amount2);

      expect(result.value).toBe(-70);
    });

    it('should throw when subtracting different assets', () => {
      const btcAmount = Amount.from(100, btc);
      const usdtAmount = Amount.from(50, usdt);

      expect(() => btcAmount.subtract(usdtAmount)).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('arithmetic - subtractOrZero', () => {
    it('should subtract normally when result is positive', () => {
      const amount1 = Amount.from(100, btc);
      const amount2 = Amount.from(30, btc);

      const result = amount1.subtractOrZero(amount2);

      expect(result.value).toBe(70);
    });

    it('should floor at zero when result would be negative', () => {
      const amount1 = Amount.from(30, btc);
      const amount2 = Amount.from(100, btc);

      const result = amount1.subtractOrZero(amount2);

      expect(result.value).toBe(0);
    });

    it('should return zero when amounts are equal', () => {
      const amount1 = Amount.from(100, btc);
      const amount2 = Amount.from(100, btc);

      const result = amount1.subtractOrZero(amount2);

      expect(result.value).toBe(0);
    });
  });

  describe('arithmetic - multiply', () => {
    it('should multiply by positive factor', () => {
      const amount = Amount.from(100, btc);

      const result = amount.multiply(2.5);

      expect(result.value).toBe(250);
      expect(result.asset.equals(btc)).toBe(true);
    });

    it('should multiply by zero', () => {
      const amount = Amount.from(100, btc);

      const result = amount.multiply(0);

      expect(result.value).toBe(0);
    });

    it('should multiply by negative factor', () => {
      const amount = Amount.from(100, btc);

      const result = amount.multiply(-2);

      expect(result.value).toBe(-200);
    });

    it('should throw on infinite factor', () => {
      const amount = Amount.from(100, btc);

      expect(() => amount.multiply(Infinity)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on NaN factor', () => {
      const amount = Amount.from(100, btc);

      expect(() => amount.multiply(NaN)).toThrow(InvalidValueObjectException);
    });
  });

  describe('arithmetic - divide', () => {
    it('should divide by positive divisor', () => {
      const amount = Amount.from(100, btc);

      const result = amount.divide(4);

      expect(result.value).toBe(25);
      expect(result.asset.equals(btc)).toBe(true);
    });

    it('should divide by negative divisor', () => {
      const amount = Amount.from(100, btc);

      const result = amount.divide(-2);

      expect(result.value).toBe(-50);
    });

    it('should throw when dividing by zero', () => {
      const amount = Amount.from(100, btc);

      expect(() => amount.divide(0)).toThrow(InvalidValueObjectException);
    });

    it('should throw when dividing by infinity', () => {
      const amount = Amount.from(100, btc);

      expect(() => amount.divide(Infinity)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw when dividing by NaN', () => {
      const amount = Amount.from(100, btc);

      expect(() => amount.divide(NaN)).toThrow(InvalidValueObjectException);
    });
  });

  describe('arithmetic - abs', () => {
    it('should return absolute value of positive amount', () => {
      const amount = Amount.from(100, btc);

      const result = amount.abs();

      expect(result.value).toBe(100);
    });

    it('should return absolute value of negative amount', () => {
      const amount = Amount.from(-100, btc);

      const result = amount.abs();

      expect(result.value).toBe(100);
    });

    it('should return zero for zero amount', () => {
      const amount = Amount.zero(btc);

      const result = amount.abs();

      expect(result.value).toBe(0);
    });
  });

  describe('arithmetic - negate', () => {
    it('should negate positive amount', () => {
      const amount = Amount.from(100, btc);

      const result = amount.negate();

      expect(result.value).toBe(-100);
    });

    it('should negate negative amount', () => {
      const amount = Amount.from(-100, btc);

      const result = amount.negate();

      expect(result.value).toBe(100);
    });

    it('should negate zero', () => {
      const amount = Amount.zero(btc);

      const result = amount.negate();

      expect(Math.abs(result.value)).toBe(0);
    });
  });

  describe('arithmetic - percentageOf', () => {
    it('should calculate percentage of amount', () => {
      const amount = Amount.from(100, usdt);

      const result = amount.percentageOf(10);

      expect(result.value).toBe(10);
    });

    it('should calculate 0% of amount', () => {
      const amount = Amount.from(100, usdt);

      const result = amount.percentageOf(0);

      expect(result.value).toBe(0);
    });

    it('should calculate 100% of amount', () => {
      const amount = Amount.from(100, usdt);

      const result = amount.percentageOf(100);

      expect(result.value).toBe(100);
    });

    it('should calculate fractional percentage', () => {
      const amount = Amount.from(100, usdt);

      const result = amount.percentageOf(2.5);

      expect(result.value).toBe(2.5);
    });

    it('should throw on negative percentage', () => {
      const amount = Amount.from(100, usdt);

      expect(() => amount.percentageOf(-10)).toThrow(InvalidOperationException);
    });

    it('should throw on percentage greater than 100', () => {
      const amount = Amount.from(100, usdt);

      expect(() => amount.percentageOf(101)).toThrow(InvalidOperationException);
    });
  });

  describe('comparison - checks', () => {
    it('should check if amount is zero', () => {
      const zero = Amount.zero(btc);
      const nonZero = Amount.from(100, btc);

      expect(zero.isZero()).toBe(true);
      expect(nonZero.isZero()).toBe(false);
    });

    it('should check if amount is positive', () => {
      const positive = Amount.from(100, btc);
      const negative = Amount.from(-100, btc);
      const zero = Amount.zero(btc);

      expect(positive.isPositive()).toBe(true);
      expect(negative.isPositive()).toBe(false);
      expect(zero.isPositive()).toBe(false);
    });

    it('should check if amount is negative', () => {
      const positive = Amount.from(100, btc);
      const negative = Amount.from(-100, btc);
      const zero = Amount.zero(btc);

      expect(positive.isNegative()).toBe(false);
      expect(negative.isNegative()).toBe(true);
      expect(zero.isNegative()).toBe(false);
    });

    it('should check if amount is valid size', () => {
      const positive = Amount.from(100, btc);
      const zero = Amount.zero(btc);
      const negative = Amount.from(-100, btc);

      expect(positive.isValidSize()).toBe(true);
      expect(zero.isValidSize()).toBe(false);
      expect(negative.isValidSize()).toBe(false);
    });

    it('should check if amount is valid volume', () => {
      const positive = Amount.from(100, btc);
      const zero = Amount.zero(btc);
      const negative = Amount.from(-100, btc);

      expect(positive.isValidVolume()).toBe(true);
      expect(zero.isValidVolume()).toBe(true);
      expect(negative.isValidVolume()).toBe(false);
    });
  });

  describe('comparison - relational', () => {
    const amount1 = Amount.from(100, btc);
    const amount2 = Amount.from(200, btc);
    const amount3 = Amount.from(100, btc);

    it('should compare greater than', () => {
      expect(amount2.greaterThan(amount1)).toBe(true);
      expect(amount1.greaterThan(amount2)).toBe(false);
      expect(amount1.greaterThan(amount3)).toBe(false);
    });

    it('should compare greater than or equal', () => {
      expect(amount2.greaterThanOrEqual(amount1)).toBe(true);
      expect(amount1.greaterThanOrEqual(amount3)).toBe(true);
      expect(amount1.greaterThanOrEqual(amount2)).toBe(false);
    });

    it('should compare less than', () => {
      expect(amount1.lessThan(amount2)).toBe(true);
      expect(amount2.lessThan(amount1)).toBe(false);
      expect(amount1.lessThan(amount3)).toBe(false);
    });

    it('should compare less than or equal', () => {
      expect(amount1.lessThanOrEqual(amount2)).toBe(true);
      expect(amount1.lessThanOrEqual(amount3)).toBe(true);
      expect(amount2.lessThanOrEqual(amount1)).toBe(false);
    });

    it('should check equality', () => {
      expect(amount1.equals(amount3)).toBe(true);
      expect(amount1.equals(amount2)).toBe(false);
    });

    it('should check equality with different assets', () => {
      const btcAmount = Amount.from(100, btc);
      const ethAmount = Amount.from(100, eth);

      expect(btcAmount.equals(ethAmount)).toBe(false);
    });

    it('should throw when comparing different assets - greaterThan', () => {
      const btcAmount = Amount.from(100, btc);
      const ethAmount = Amount.from(100, eth);

      expect(() => btcAmount.greaterThan(ethAmount)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw when comparing different assets - lessThan', () => {
      const btcAmount = Amount.from(100, btc);
      const ethAmount = Amount.from(100, eth);

      expect(() => btcAmount.lessThan(ethAmount)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw when comparing different assets - greaterThanOrEqual', () => {
      const btcAmount = Amount.from(100, btc);
      const ethAmount = Amount.from(100, eth);

      expect(() => btcAmount.greaterThanOrEqual(ethAmount)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw when comparing different assets - lessThanOrEqual', () => {
      const btcAmount = Amount.from(100, btc);
      const ethAmount = Amount.from(100, eth);

      expect(() => btcAmount.lessThanOrEqual(ethAmount)).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('display - format', () => {
    it('should format with default precision', () => {
      const amount = Amount.from(100.123456, btc);

      const result = amount.format();

      expect(result).toBe('100.123456 BTC');
    });

    it('should format with specified decimals', () => {
      const amount = Amount.from(100.123456, btc);

      const result = amount.format(2);

      expect(result).toBe('100.12 BTC');
    });

    it('should format with zero decimals', () => {
      const amount = Amount.from(100.123456, btc);

      const result = amount.format(0);

      expect(result).toBe('100 BTC');
    });

    it('should format zero amount', () => {
      const amount = Amount.zero(btc);

      const result = amount.format();

      expect(result).toBe('0 BTC');
    });

    it('should format negative amount', () => {
      const amount = Amount.from(-100.5, btc);

      const result = amount.format(2);

      expect(result).toBe('-100.50 BTC');
    });
  });

  describe('display - toString', () => {
    it('should convert to string', () => {
      const amount = Amount.from(100.5, btc);

      expect(amount.toString()).toBe('100.5 BTC');
    });

    it('should convert zero to string', () => {
      const amount = Amount.zero(usdt);

      expect(amount.toString()).toBe('0 USDT');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const amount = Amount.from(100.5, btc);
      const json = amount.toJSON();

      expect(json).toEqual({
        value: 100.5,
        asset: 'BTC',
      });
    });

    it('should serialize zero amount to JSON', () => {
      const amount = Amount.zero(usdt);
      const json = amount.toJSON();

      expect(json).toEqual({
        value: 0,
        asset: 'USDT',
      });
    });

    it('should serialize negative amount to JSON', () => {
      const amount = Amount.from(-50.25, eth);
      const json = amount.toJSON();

      expect(json).toEqual({
        value: -50.25,
        asset: 'ETH',
      });
    });
  });

  describe('immutability', () => {
    it('should not modify original amount on add', () => {
      const original = Amount.from(100, btc);
      const toAdd = Amount.from(50, btc);

      original.add(toAdd);

      expect(original.value).toBe(100);
    });

    it('should not modify original amount on subtract', () => {
      const original = Amount.from(100, btc);
      const toSubtract = Amount.from(50, btc);

      original.subtract(toSubtract);

      expect(original.value).toBe(100);
    });

    it('should not modify original amount on multiply', () => {
      const original = Amount.from(100, btc);

      original.multiply(2);

      expect(original.value).toBe(100);
    });

    it('should not modify original amount on divide', () => {
      const original = Amount.from(100, btc);

      original.divide(2);

      expect(original.value).toBe(100);
    });

    it('should not modify original amount on abs', () => {
      const original = Amount.from(-100, btc);

      original.abs();

      expect(original.value).toBe(-100);
    });

    it('should not modify original amount on negate', () => {
      const original = Amount.from(100, btc);

      original.negate();

      expect(original.value).toBe(100);
    });
  });
});
