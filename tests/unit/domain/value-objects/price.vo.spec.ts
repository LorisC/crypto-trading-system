import { describe, expect, it } from 'vitest';
import { Price } from '@/domain/value-objects/price.vo';
import { InvalidValueObjectException } from '@/domain/exceptions';
import { Asset, Percentage, TradingPair } from '@domain/value-objects';
import { AssetType } from '@domain/enum';

describe('Price Value Object', () => {
  const pair = TradingPair.from(
    Asset.from('BTC', AssetType.CRYPTOCURRENCY),
    Asset.from('USDT', AssetType.STABLECOIN),
  );

  describe('creation', () => {
    it('should create valid price', () => {
      const price = Price.from(50000, pair);

      expect(price.value).toBe(50000);
      expect(price.pair.equals(pair)).toBe(true);
    });

    it('should throw on negative price', () => {
      expect(() => Price.from(-100, pair)).toThrow(InvalidValueObjectException);
    });

    it('should throw on zero price', () => {
      expect(() => Price.from(0, pair)).toThrow(InvalidValueObjectException);
    });

    it('should handle decimal prices', () => {
      const price = Price.from(50000.12345, pair);

      expect(price.value).toBe(50000.12345);
    });

    it('should handle very small prices', () => {
      const price = Price.from(0.00001, pair);

      expect(price.value).toBe(0.00001);
    });
  });

  describe('comparisons', () => {
    const price1 = Price.from(50000, pair);
    const price2 = Price.from(60000, pair);
    const price3 = Price.from(50000, pair);

    it('should compare greater than', () => {
      expect(price2.greaterThan(price1)).toBe(true);
      expect(price1.greaterThan(price2)).toBe(false);
    });

    it('should compare less than', () => {
      expect(price1.lessThan(price2)).toBe(true);
      expect(price2.lessThan(price1)).toBe(false);
    });

    it('should compare equality', () => {
      expect(price1.equals(price3)).toBe(true);
      expect(price1.equals(price2)).toBe(false);
    });

    it('should throw when comparing different pairs', () => {
      const ethPair = TradingPair.from(
        Asset.from('ETH', AssetType.CRYPTOCURRENCY),
        Asset.from('USDT', AssetType.STABLECOIN),
      );
      const ethPrice = Price.from(3000, ethPair);

      expect(() => price1.greaterThan(ethPrice)).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('arithmetic', () => {
    const price = Price.from(50000, pair);

    it('should multiply by quantity', () => {
      const result = price.multiplyBy(2);

      expect(result.value).toBe(100000);
      expect(result.pair.equals(pair)).toBe(true);
    });

    it('should calculate percentage change', () => {
      const newPrice = Price.from(55000, pair);
      const change = price.percentageChangeTo(newPrice);

      expect(change.value).toBe(10); // 10% increase
    });

    it('should apply percentage increase', () => {
      const result = price.applyPercentageChange(Percentage.from(10));

      expect(result.value).toBe(55000);
    });

    it('should apply percentage decrease', () => {
      const result = price.applyPercentageChange(Percentage.from(-10));

      expect(result.value).toBe(45000);
    });
  });

  describe('percentage calculations', () => {
    const price = Price.from(50000, pair);
    const newPrice = Price.from(55000, pair);

    it('should calculate percentage change TO higher price', () => {
      const change = price.percentageChangeTo(newPrice);

      expect(change.value).toBe(10); // (55000 - 50000) / 50000 = 10%
    });

    it('should calculate percentage change FROM lower price', () => {
      const change = newPrice.percentageChangeFrom(price);

      expect(change.value).toBe(10); // (55000 - 50000) / 50000 = 10%
    });

    it('should calculate percentage change TO lower price', () => {
      const change = newPrice.percentageChangeTo(price);

      expect(change.value).toBeCloseTo(-9.09, 2); // (50000 - 55000) / 55000 = -9.09%
    });

    it('should calculate percentage change FROM higher price', () => {
      const change = price.percentageChangeFrom(newPrice);

      expect(change.value).toBeCloseTo(-9.09, 2); // (50000 - 55000) / 55000 = -9.09%
    });

    it('should handle large percentage increases', () => {
      const doubled = Price.from(100000, pair);
      const change = price.percentageChangeTo(doubled);

      expect(change.value).toBe(100); // (100000 - 50000) / 50000 = 100%
    });

    it('should handle large percentage decreases', () => {
      const halved = Price.from(25000, pair);
      const change = price.percentageChangeTo(halved);

      expect(change.value).toBe(-50); // (25000 - 50000) / 50000 = -50%
    });
  });

  describe('formatting', () => {
    it('should format with default precision', () => {
      const price = Price.from(50000.123456, pair);

      expect(price.format(2)).toBe(`50000.12`);
    });

    it('should format with custom precision', () => {
      const price = Price.from(50000.123456, pair);

      expect(price.format(4)).toBe(`50000.1235`);
    });

    it('should convert to string', () => {
      const price = Price.from(50000, pair);

      expect(price.toString()).toBe('50000 BTC/USDT');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const price = Price.from(50000, pair);
      const json = price.toJSON();

      expect(json).toEqual({
        value: 50000,
        pair: 'BTC/USDT',
        base: 'BTC',
        quote: 'USDT',
      });
    });
  });
});
