import { describe, expect, it } from 'vitest';
import { TradingPair } from '@/domain/value-objects/tading-pair.vo';
import { Asset } from '@/domain/value-objects/asset.vo';
import { InvalidValueObjectException } from '@/domain/exceptions';
import { AssetType } from '@domain/enum';

describe('TradingPair Value Object', () => {
  const btc = Asset.from('BTC', AssetType.CRYPTOCURRENCY);
  const eth = Asset.from('ETH', AssetType.CRYPTOCURRENCY);
  const usdt = Asset.from('USDT', AssetType.STABLECOIN);
  const usdc = Asset.from('USDC', AssetType.STABLECOIN);
  const usd = Asset.from('USD', AssetType.FIAT);

  describe('creation', () => {
    it('should create valid trading pair', () => {
      const pair = TradingPair.from(btc, usdt);

      expect(pair.base.equals(btc)).toBe(true);
      expect(pair.quote.equals(usdt)).toBe(true);
    });

    it('should create crypto/crypto pair', () => {
      const pair = TradingPair.from(eth, btc);

      expect(pair.base.equals(eth)).toBe(true);
      expect(pair.quote.equals(btc)).toBe(true);
    });

    it('should create stablecoin/stablecoin pair', () => {
      const pair = TradingPair.from(usdt, usdc);

      expect(pair.base.equals(usdt)).toBe(true);
      expect(pair.quote.equals(usdc)).toBe(true);
    });

    it('should create fiat quoted pair', () => {
      const pair = TradingPair.from(btc, usd);

      expect(pair.base.equals(btc)).toBe(true);
      expect(pair.quote.equals(usd)).toBe(true);
    });

    it('should throw when base equals quote', () => {
      expect(() => TradingPair.from(btc, btc)).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('fromSymbol factory', () => {
    it('should create from valid symbol', () => {
      const pair = TradingPair.fromSymbol('BTC/USDT');

      expect(pair.base.symbol).toBe('BTC');
      expect(pair.quote.symbol).toBe('USDT');
    });

    it('should create from symbol with spaces', () => {
      const pair = TradingPair.fromSymbol(' BTC / USDT ');

      expect(pair.base.symbol).toBe('BTC');
      expect(pair.quote.symbol).toBe('USDT');
    });

    it('should create from lowercase symbol', () => {
      const pair = TradingPair.fromSymbol('btc/usdt');

      expect(pair.base.symbol).toBe('BTC');
      expect(pair.quote.symbol).toBe('USDT');
    });

    it('should throw on invalid format without slash', () => {
      expect(() => TradingPair.fromSymbol('BTCUSDT')).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on invalid format with multiple slashes', () => {
      expect(() => TradingPair.fromSymbol('BTC/USDT/USD')).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on empty base', () => {
      expect(() => TradingPair.fromSymbol('/USDT')).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on empty quote', () => {
      expect(() => TradingPair.fromSymbol('BTC/')).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('query methods', () => {
    it('should identify stablecoin pair', () => {
      const pair = TradingPair.from(usdt, usdc);

      expect(pair.isStablePair()).toBe(true);
      expect(pair.isStableQuoted()).toBe(true);
      expect(pair.isFiatQuoted()).toBe(false);
      expect(pair.isCryptoPair()).toBe(false);
    });

    it('should identify stable quoted pair', () => {
      const pair = TradingPair.from(btc, usdt);

      expect(pair.isStablePair()).toBe(false);
      expect(pair.isStableQuoted()).toBe(true);
      expect(pair.isFiatQuoted()).toBe(false);
      expect(pair.isCryptoPair()).toBe(false);
    });

    it('should identify fiat quoted pair', () => {
      const pair = TradingPair.from(btc, usd);

      expect(pair.isStablePair()).toBe(false);
      expect(pair.isStableQuoted()).toBe(false);
      expect(pair.isFiatQuoted()).toBe(true);
      expect(pair.isCryptoPair()).toBe(false);
    });

    it('should identify crypto pair', () => {
      const pair = TradingPair.from(eth, btc);

      expect(pair.isStablePair()).toBe(false);
      expect(pair.isStableQuoted()).toBe(false);
      expect(pair.isFiatQuoted()).toBe(false);
      expect(pair.isCryptoPair()).toBe(true);
    });
  });

  describe('operations', () => {
    it('should get inverse pair', () => {
      const pair = TradingPair.from(btc, usdt);
      const inverse = pair.inverse();

      expect(inverse.base.equals(usdt)).toBe(true);
      expect(inverse.quote.equals(btc)).toBe(true);
    });

    it('should get inverse of inverse', () => {
      const pair = TradingPair.from(btc, usdt);
      const inverse = pair.inverse().inverse();

      expect(inverse.equals(pair)).toBe(true);
    });
  });

  describe('comparison', () => {
    it('should equal same pair', () => {
      const pair1 = TradingPair.from(btc, usdt);
      const pair2 = TradingPair.from(btc, usdt);

      expect(pair1.equals(pair2)).toBe(true);
    });

    it('should not equal different base', () => {
      const pair1 = TradingPair.from(btc, usdt);
      const pair2 = TradingPair.from(eth, usdt);

      expect(pair1.equals(pair2)).toBe(false);
    });

    it('should not equal different quote', () => {
      const pair1 = TradingPair.from(btc, usdt);
      const pair2 = TradingPair.from(btc, usdc);

      expect(pair1.equals(pair2)).toBe(false);
    });

    it('should not equal inverse pair', () => {
      const pair1 = TradingPair.from(btc, usdt);
      const pair2 = TradingPair.from(usdt, btc);

      expect(pair1.equals(pair2)).toBe(false);
    });
  });

  describe('formatting', () => {
    it('should convert to symbol', () => {
      const pair = TradingPair.from(btc, usdt);

      expect(pair.toSymbol()).toBe('BTC/USDT');
    });

    it('should convert to string', () => {
      const pair = TradingPair.from(btc, usdt);

      expect(pair.toString()).toBe('BTC/USDT');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const pair = TradingPair.from(btc, usdt);
      const json = pair.toJSON();

      expect(json.symbol).toBe('BTC/USDT');
      expect(json.base).toBe('BTC');
      expect(json.quote).toBe('USDT');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const pair = TradingPair.from(btc, usdt);

      expect(() => {
        (pair as any).base = eth;
      }).toThrow();
    });
  });
});
