import { describe, expect, it } from 'vitest';
import { OrderBookLevel } from '@/domain/value-objects/order-book-level.vo';
import { Price } from '@/domain/value-objects/price.vo';
import { Amount } from '@/domain/value-objects/amount.vo';
import { TradingPair } from '@/domain/value-objects/tading-pair.vo';
import { Asset } from '@/domain/value-objects/asset.vo';
import { InvalidValueObjectException } from '@/domain/exceptions';
import { AssetType } from '@domain/enum';

describe('OrderBookLevel Value Object', () => {
  const btc = Asset.from('BTC', AssetType.CRYPTOCURRENCY);
  const usdt = Asset.from('USDT', AssetType.STABLECOIN);
  const pair = TradingPair.from(btc, usdt);

  describe('creation', () => {
    it('should create valid order book level', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(1.5, btc);
      const level = OrderBookLevel.from(price, quantity);

      expect(level.getPrice().equals(price)).toBe(true);
      expect(level.getQuantity().equals(quantity)).toBe(true);
    });

    it('should create with small quantity', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(0.001, btc);
      const level = OrderBookLevel.from(price, quantity);

      expect(level.getQuantity().value).toBe(0.001);
    });

    it('should create with large quantity', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(1000, btc);
      const level = OrderBookLevel.from(price, quantity);

      expect(level.getQuantity().value).toBe(1000);
    });

    it('should throw on zero quantity', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.zero(btc);

      expect(() => OrderBookLevel.from(price, quantity)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on negative quantity', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(-1, btc);

      expect(() => OrderBookLevel.from(price, quantity)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw when quantity asset does not match price pair base', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(1000, usdt); // Wrong asset

      expect(() => OrderBookLevel.from(price, quantity)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw when quantity is in quote asset instead of base', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(50000, usdt); // Should be BTC, not USDT

      expect(() => OrderBookLevel.from(price, quantity)).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('calculations', () => {
    it('should calculate total value', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(2, btc);
      const level = OrderBookLevel.from(price, quantity);

      const totalValue = level.getTotalValue();

      expect(totalValue.value).toBe(100000); // 50000 * 2
      expect(totalValue.asset.equals(usdt)).toBe(true);
    });

    it('should calculate total value with decimal quantity', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(1.5, btc);
      const level = OrderBookLevel.from(price, quantity);

      const totalValue = level.getTotalValue();

      expect(totalValue.value).toBe(75000); // 50000 * 1.5
    });

    it('should calculate total value with decimal price', () => {
      const price = Price.from(50000.5, pair);
      const quantity = Amount.from(2, btc);
      const level = OrderBookLevel.from(price, quantity);

      const totalValue = level.getTotalValue();

      expect(totalValue.value).toBe(100001); // 50000.5 * 2
    });

    it('should calculate total value with small quantity', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(0.001, btc);
      const level = OrderBookLevel.from(price, quantity);

      const totalValue = level.getTotalValue();

      expect(totalValue.value).toBe(50); // 50000 * 0.001
    });
  });

  describe('comparison', () => {
    it('should equal same price and quantity', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(1.5, btc);
      const level1 = OrderBookLevel.from(price, quantity);
      const level2 = OrderBookLevel.from(
        Price.from(50000, pair),
        Amount.from(1.5, btc),
      );

      expect(level1.equals(level2)).toBe(true);
    });

    it('should not equal different price', () => {
      const quantity = Amount.from(1.5, btc);
      const level1 = OrderBookLevel.from(Price.from(50000, pair), quantity);
      const level2 = OrderBookLevel.from(Price.from(50001, pair), quantity);

      expect(level1.equals(level2)).toBe(false);
    });

    it('should not equal different quantity', () => {
      const price = Price.from(50000, pair);
      const level1 = OrderBookLevel.from(price, Amount.from(1.5, btc));
      const level2 = OrderBookLevel.from(price, Amount.from(1.6, btc));

      expect(level1.equals(level2)).toBe(false);
    });

    it('should not equal different price and quantity', () => {
      const level1 = OrderBookLevel.from(
        Price.from(50000, pair),
        Amount.from(1.5, btc),
      );
      const level2 = OrderBookLevel.from(
        Price.from(50001, pair),
        Amount.from(1.6, btc),
      );

      expect(level1.equals(level2)).toBe(false);
    });
  });

  describe('formatting', () => {
    it('should convert to string', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(1.5, btc);
      const level = OrderBookLevel.from(price, quantity);

      const str = level.toString();

      expect(str).toContain('50000');
      expect(str).toContain('1.5');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(2, btc);
      const level = OrderBookLevel.from(price, quantity);

      const json = level.toJSON();

      expect(json.price).toBe(50000);
      expect(json.quantity).toBe(2);
      expect(json.totalValue).toBe(100000);
    });

    it('should serialize with decimal values', () => {
      const price = Price.from(50000.5, pair);
      const quantity = Amount.from(1.5, btc);
      const level = OrderBookLevel.from(price, quantity);

      const json = level.toJSON();

      expect(json.price).toBe(50000.5);
      expect(json.quantity).toBe(1.5);
      expect(json.totalValue).toBe(75000.75);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const price = Price.from(50000, pair);
      const quantity = Amount.from(1.5, btc);
      const level = OrderBookLevel.from(price, quantity);

      expect(() => {
        (level as any).price = null;
      }).toThrow();
    });
  });
});
