import { describe, expect, it } from 'vitest';
import { Kline } from '@/domain/value-objects/kline.vo';
import { Price } from '@/domain/value-objects/price.vo';
import { Amount } from '@/domain/value-objects/amount.vo';
import { TradingPair } from '@/domain/value-objects/tading-pair.vo';
import { Asset } from '@/domain/value-objects/asset.vo';
import { Timestamp } from '@/domain/value-objects/timestamp.vo';
import { Timeframe } from '@/domain/value-objects/timeframe.vo';
import { InvalidValueObjectException } from '@/domain/exceptions';
import { AssetType } from '@domain/enum';

describe('Kline Value Object', () => {
  const btc = Asset.from('BTC', AssetType.CRYPTOCURRENCY);
  const usdt = Asset.from('USDT', AssetType.STABLECOIN);
  const pair = TradingPair.from(btc, usdt);
  const timeframe = Timeframe.from('1h');
  const openTime = Timestamp.fromMilliseconds(1609459200000); // 2021-01-01 00:00:00

  const createValidKline = (overrides = {}) => {
    return Kline.from({
      pair,
      timeframe,
      openTime,
      open: Price.from(50000, pair),
      high: Price.from(51000, pair),
      low: Price.from(49000, pair),
      close: Price.from(50500, pair),
      volume: Amount.from(10, btc),
      ...overrides,
    });
  };

  describe('creation', () => {
    it('should create valid kline', () => {
      const kline = createValidKline();

      expect(kline.getPair().equals(pair)).toBe(true);
      expect(kline.getTimeframe().equals(timeframe)).toBe(true);
      expect(kline.getOpenTime().equals(openTime)).toBe(true);
      expect(kline.getOpen().value).toBe(50000);
      expect(kline.getHigh().value).toBe(51000);
      expect(kline.getLow().value).toBe(49000);
      expect(kline.getClose().value).toBe(50500);
      expect(kline.getVolume().value).toBe(10);
    });

    it('should create kline with optional quote volume', () => {
      const kline = createValidKline({
        quoteVolume: Amount.from(505000, usdt),
      });

      expect(kline.getQuoteVolume()?.value).toBe(505000);
    });

    it('should create kline with optional trades count', () => {
      const kline = createValidKline({
        trades: 150,
      });

      expect(kline.getTrades()).toBe(150);
    });

    it('should calculate close time if not provided', () => {
      const kline = createValidKline();
      const expectedCloseTime = openTime
        .addTimeframe(timeframe)
        .subtractMilliseconds(1);

      expect(kline.getCloseTime().toMilliseconds()).toBe(
        expectedCloseTime.toMilliseconds(),
      );
    });
  });

  describe('validation - price pair matching', () => {
    const ethPair = TradingPair.from(
      Asset.from('ETH', AssetType.CRYPTOCURRENCY),
      usdt,
    );

    it('should throw when open price pair does not match', () => {
      expect(() =>
        createValidKline({
          open: Price.from(3000, ethPair),
        }),
      ).toThrow(InvalidValueObjectException);
    });

    it('should throw when high price pair does not match', () => {
      expect(() =>
        createValidKline({
          high: Price.from(3100, ethPair),
        }),
      ).toThrow(InvalidValueObjectException);
    });

    it('should throw when low price pair does not match', () => {
      expect(() =>
        createValidKline({
          low: Price.from(2900, ethPair),
        }),
      ).toThrow(InvalidValueObjectException);
    });

    it('should throw when close price pair does not match', () => {
      expect(() =>
        createValidKline({
          close: Price.from(3050, ethPair),
        }),
      ).toThrow(InvalidValueObjectException);
    });
  });

  describe('validation - OHLC relationships', () => {
    it('should throw when high < low', () => {
      expect(() =>
        createValidKline({
          high: Price.from(48000, pair),
          low: Price.from(49000, pair),
        }),
      ).toThrow(InvalidValueObjectException);
    });

    it('should throw when high < open', () => {
      expect(() =>
        createValidKline({
          open: Price.from(52000, pair),
          high: Price.from(51000, pair),
        }),
      ).toThrow(InvalidValueObjectException);
    });

    it('should throw when high < close', () => {
      expect(() =>
        createValidKline({
          close: Price.from(52000, pair),
          high: Price.from(51000, pair),
        }),
      ).toThrow(InvalidValueObjectException);
    });

    it('should throw when low > open', () => {
      expect(() =>
        createValidKline({
          open: Price.from(48000, pair),
          low: Price.from(49000, pair),
        }),
      ).toThrow(InvalidValueObjectException);
    });

    it('should throw when low > close', () => {
      expect(() =>
        createValidKline({
          close: Price.from(48000, pair),
          low: Price.from(49000, pair),
        }),
      ).toThrow(InvalidValueObjectException);
    });

    it('should allow high = low (flat line)', () => {
      const kline = createValidKline({
        open: Price.from(50000, pair),
        high: Price.from(50000, pair),
        low: Price.from(50000, pair),
        close: Price.from(50000, pair),
      });

      expect(kline.getHigh().value).toBe(50000);
      expect(kline.getLow().value).toBe(50000);
    });
  });

  describe('validation - volume', () => {
    it('should throw when volume is negative', () => {
      expect(() =>
        createValidKline({
          volume: Amount.from(-10, btc),
        }),
      ).toThrow(InvalidValueObjectException);
    });

    it('should throw when volume asset does not match base', () => {
      expect(() =>
        createValidKline({
          volume: Amount.from(10, usdt),
        }),
      ).toThrow(InvalidValueObjectException);
    });

    it('should allow zero volume', () => {
      const kline = createValidKline({
        volume: Amount.zero(btc),
      });

      expect(kline.getVolume().isZero()).toBe(true);
    });

    it('should throw when quote volume asset does not match quote', () => {
      expect(() =>
        createValidKline({
          quoteVolume: Amount.from(500000, btc),
        }),
      ).toThrow(InvalidValueObjectException);
    });
  });

  describe('validation - time alignment', () => {
    it('should throw when open time is not aligned to timeframe', () => {
      const unalignedTime = Timestamp.fromMilliseconds(1609459200123); // Not aligned

      expect(() =>
        createValidKline({
          openTime: unalignedTime,
        }),
      ).toThrow(InvalidValueObjectException);
    });
  });

  describe('validation - trades count', () => {
    it('should throw when trades count is negative', () => {
      expect(() =>
        createValidKline({
          trades: -10,
        }),
      ).toThrow(InvalidValueObjectException);
    });

    it('should allow zero trades', () => {
      const kline = createValidKline({
        trades: 0,
      });

      expect(kline.getTrades()).toBe(0);
    });
  });

  describe('derived values', () => {
    it('should calculate range', () => {
      const kline = createValidKline();
      const range = kline.getRange();

      expect(range.value).toBe(2000); // 51000 - 49000
      expect(range.asset.equals(usdt)).toBe(true);
    });

    it('should calculate body size for bullish candle', () => {
      const kline = createValidKline({
        open: Price.from(50000, pair),
        close: Price.from(50500, pair),
      });
      const bodySize = kline.getBodySize();

      expect(bodySize.value).toBe(500); // |50500 - 50000|
    });

    it('should calculate body size for bearish candle', () => {
      const kline = createValidKline({
        open: Price.from(50500, pair),
        close: Price.from(50000, pair),
      });
      const bodySize = kline.getBodySize();

      expect(bodySize.value).toBe(500); // |50000 - 50500|
    });

    it('should calculate upper wick for bullish candle', () => {
      const kline = createValidKline({
        open: Price.from(50000, pair),
        close: Price.from(50500, pair),
        high: Price.from(51000, pair),
      });
      const upperWick = kline.getUpperWick();

      expect(upperWick.value).toBe(500); // 51000 - 50500
    });

    it('should calculate upper wick for bearish candle', () => {
      const kline = createValidKline({
        open: Price.from(50500, pair),
        close: Price.from(50000, pair),
        high: Price.from(51000, pair),
      });
      const upperWick = kline.getUpperWick();

      expect(upperWick.value).toBe(500); // 51000 - 50500
    });

    it('should calculate lower wick for bullish candle', () => {
      const kline = createValidKline({
        open: Price.from(50000, pair),
        close: Price.from(50500, pair),
        low: Price.from(49000, pair),
      });
      const lowerWick = kline.getLowerWick();

      expect(lowerWick.value).toBe(1000); // 50000 - 49000
    });

    it('should calculate lower wick for bearish candle', () => {
      const kline = createValidKline({
        open: Price.from(50500, pair),
        close: Price.from(50000, pair),
        low: Price.from(49000, pair),
      });
      const lowerWick = kline.getLowerWick();

      expect(lowerWick.value).toBe(1000); // 50000 - 49000
    });

    it('should calculate midpoint', () => {
      const kline = createValidKline();
      const midpoint = kline.getMidpoint();

      expect(midpoint.value).toBe(50000); // (51000 + 49000) / 2
    });

    it('should calculate typical price', () => {
      const kline = createValidKline();
      const typical = kline.getTypicalPrice();

      expect(typical.value).toBeCloseTo(50166.67, 2); // (51000 + 49000 + 50500) / 3
    });

    it('should calculate weighted close', () => {
      const kline = createValidKline();
      const weighted = kline.getWeightedClose();

      expect(weighted.value).toBe(50250); // (51000 + 49000 + 2*50500) / 4
    });

    it('should calculate price change for bullish candle', () => {
      const kline = createValidKline({
        open: Price.from(50000, pair),
        close: Price.from(50500, pair),
      });
      const change = kline.getPriceChange();

      expect(change.value).toBe(500);
    });

    it('should calculate price change for bearish candle', () => {
      const kline = createValidKline({
        open: Price.from(50500, pair),
        close: Price.from(50000, pair),
      });
      const change = kline.getPriceChange();

      expect(change.value).toBe(-500);
    });

    it('should calculate price change percent', () => {
      const kline = createValidKline({
        open: Price.from(50000, pair),
        close: Price.from(50500, pair),
      });
      const changePercent = kline.getPriceChangePercent();

      expect(changePercent).toBe(1); // (500 / 50000) * 100
    });

    it('should calculate average price when quote volume provided', () => {
      const kline = createValidKline({
        volume: Amount.from(10, btc),
        quoteVolume: Amount.from(505000, usdt),
      });
      const avgPrice = kline.getAveragePrice();

      expect(avgPrice?.value).toBe(50500); // 505000 / 10
    });

    it('should return null average price when quote volume not provided', () => {
      const kline = createValidKline();
      const avgPrice = kline.getAveragePrice();

      expect(avgPrice).toBeNull();
    });

    it('should return null average price when volume is zero', () => {
      const kline = createValidKline({
        volume: Amount.zero(btc),
        quoteVolume: Amount.from(0, usdt),
      });
      const avgPrice = kline.getAveragePrice();

      expect(avgPrice).toBeNull();
    });
  });

  describe('pattern recognition', () => {
    it('should identify bullish candle', () => {
      const kline = createValidKline({
        open: Price.from(50000, pair),
        close: Price.from(50500, pair),
      });

      expect(kline.isBullish()).toBe(true);
      expect(kline.isBearish()).toBe(false);
    });

    it('should identify bearish candle', () => {
      const kline = createValidKline({
        open: Price.from(50500, pair),
        close: Price.from(50000, pair),
      });

      expect(kline.isBullish()).toBe(false);
      expect(kline.isBearish()).toBe(true);
    });

    it('should identify doji pattern', () => {
      const kline = createValidKline({
        open: Price.from(50000, pair),
        close: Price.from(50001, pair), // Very small body
        high: Price.from(51000, pair),
        low: Price.from(49000, pair),
      });

      expect(kline.isDoji()).toBe(true);
    });

    it('should identify flat line as doji', () => {
      const kline = createValidKline({
        open: Price.from(50000, pair),
        close: Price.from(50000, pair),
        high: Price.from(50000, pair),
        low: Price.from(50000, pair),
      });

      expect(kline.isDoji()).toBe(true);
    });

    it('should identify hammer pattern', () => {
      const kline = createValidKline({
        open: Price.from(50000, pair),
        close: Price.from(50100, pair),
        high: Price.from(50150, pair),
        low: Price.from(49000, pair), // Long lower wick
      });

      expect(kline.isHammer()).toBe(true);
    });

    it('should identify shooting star pattern', () => {
      const kline = createValidKline({
        open: Price.from(50000, pair),
        close: Price.from(49900, pair),
        high: Price.from(51000, pair), // Long upper wick
        low: Price.from(49850, pair),
      });

      expect(kline.isShootingStar()).toBe(true);
    });

    it('should identify marubozu pattern', () => {
      const kline = createValidKline({
        open: Price.from(49000, pair),
        close: Price.from(51000, pair),
        high: Price.from(51000, pair),
        low: Price.from(49000, pair),
      });

      expect(kline.isMarubozu()).toBe(true);
    });

    it('should not identify marubozu when flat', () => {
      const kline = createValidKline({
        open: Price.from(50000, pair),
        close: Price.from(50000, pair),
        high: Price.from(50000, pair),
        low: Price.from(50000, pair),
      });

      expect(kline.isMarubozu()).toBe(false);
    });
  });

  describe('formatting', () => {
    it('should format kline', () => {
      const kline = createValidKline();
      const formatted = kline.format();

      expect(formatted).toContain('50000');
      expect(formatted).toContain('51000');
      expect(formatted).toContain('49000');
      expect(formatted).toContain('50500');
    });

    it('should convert to string', () => {
      const kline = createValidKline();
      const str = kline.toString();

      expect(str).toBeDefined();
      expect(typeof str).toBe('string');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const kline = createValidKline({
        quoteVolume: Amount.from(505000, usdt),
        trades: 150,
      });
      const json = kline.toJSON();

      expect(json.pair).toBe('BTC/USDT');
      expect(json.timeframe).toBeDefined();
      expect(json.open).toBe(50000);
      expect(json.high).toBe(51000);
      expect(json.low).toBe(49000);
      expect(json.close).toBe(50500);
      expect(json.volume).toBe(10);
      expect(json.quoteVolume).toBe(505000);
      expect(json.trades).toBe(150);
    });
  });
});
