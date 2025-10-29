import { Asset } from '@domain/value-objects';
import { AssetType } from '@domain/enum';
import { InvalidValueObjectException } from '@domain/exceptions';

describe('Asset', () => {
  // ============================================
  // Creation - Happy Path
  // ============================================

  describe('from()', () => {
    it('creates asset with uppercase symbol', () => {
      const asset = Asset.from('BTC');

      expect(asset.symbol).toBe('BTC');
      expect(asset.type).toBe(AssetType.UNKNOWN);
    });

    it('normalizes lowercase to uppercase', () => {
      const asset = Asset.from('btc');

      expect(asset.symbol).toBe('BTC');
    });

    it('normalizes mixed case to uppercase', () => {
      const asset = Asset.from('BtC');

      expect(asset.symbol).toBe('BTC');
    });

    it('trims whitespace', () => {
      const asset = Asset.from('  BTC  ');

      expect(asset.symbol).toBe('BTC');
    });

    it('accepts alphanumeric symbols', () => {
      const asset = Asset.from('BTC2');

      expect(asset.symbol).toBe('BTC2');
    });

    it('accepts max length symbol (10 chars)', () => {
      const asset = Asset.from('ABCDEFGHIJ');

      expect(asset.symbol).toBe('ABCDEFGHIJ');
      expect(asset.symbol.length).toBe(10);
    });

    it('accepts explicit type', () => {
      const asset = Asset.from('BTC', AssetType.CRYPTOCURRENCY);

      expect(asset.symbol).toBe('BTC');
      expect(asset.type).toBe(AssetType.CRYPTOCURRENCY);
    });
  });

  // ============================================
  // Creation - Validation Failures
  // ============================================

  describe('from() - validation', () => {
    it('rejects empty string', () => {
      expect(() => Asset.from('')).toThrow(InvalidValueObjectException);
      expect(() => Asset.from('')).toThrow('Symbol cannot be empty');
    });

    it('rejects whitespace-only string', () => {
      expect(() => Asset.from('   ')).toThrow(InvalidValueObjectException);
      expect(() => Asset.from('   ')).toThrow('Symbol cannot be empty');
    });

    it('rejects symbols with special characters', () => {
      expect(() => Asset.from('BTC-USD')).toThrow(InvalidValueObjectException);
      expect(() => Asset.from('BTC-USD')).toThrow(
        'Symbol must contain only uppercase letters and numbers',
      );
    });

    it('rejects symbols with spaces', () => {
      expect(() => Asset.from('BTC USD')).toThrow(InvalidValueObjectException);
    });

    it('rejects symbols with lowercase after normalization fails', () => {
      // Edge case: if normalization logic changes, ensure validation still applies
      const symbolWithSpecialChar = 'btc@';
      expect(() => Asset.from(symbolWithSpecialChar)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('rejects symbols longer than 10 characters', () => {
      expect(() => Asset.from('ABCDEFGHIJK')).toThrow(
        InvalidValueObjectException,
      );
      expect(() => Asset.from('ABCDEFGHIJK')).toThrow(
        'Symbol too long (max 10 characters)',
      );
    });

    it('rejects symbols with 11+ characters', () => {
      expect(() => Asset.from('A'.repeat(11))).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  // ============================================
  // Convenience Factories
  // ============================================

  describe('convenience factories', () => {
    it('crypto() sets CRYPTOCURRENCY type', () => {
      const asset = Asset.crypto('BTC');

      expect(asset.symbol).toBe('BTC');
      expect(asset.type).toBe(AssetType.CRYPTOCURRENCY);
      expect(asset.isCrypto()).toBe(true);
    });

    it('stablecoin() sets STABLECOIN type', () => {
      const asset = Asset.stablecoin('USDT');

      expect(asset.symbol).toBe('USDT');
      expect(asset.type).toBe(AssetType.STABLECOIN);
      expect(asset.isStablecoin()).toBe(true);
    });

    it('fiat() sets FIAT type', () => {
      const asset = Asset.fiat('USD');

      expect(asset.symbol).toBe('USD');
      expect(asset.type).toBe(AssetType.FIAT);
      expect(asset.isFiat()).toBe(true);
    });

    it('factories apply same validation as from()', () => {
      expect(() => Asset.crypto('')).toThrow(InvalidValueObjectException);
      expect(() => Asset.stablecoin('INVALID@')).toThrow(
        InvalidValueObjectException,
      );
      expect(() => Asset.fiat('TOOLONGSTRING')).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  // ============================================
  // Queries
  // ============================================

  describe('type queries', () => {
    it('isCrypto() returns true only for CRYPTOCURRENCY', () => {
      expect(Asset.crypto('BTC').isCrypto()).toBe(true);
      expect(Asset.stablecoin('USDT').isCrypto()).toBe(false);
      expect(Asset.fiat('USD').isCrypto()).toBe(false);
      expect(Asset.from('BTC').isCrypto()).toBe(false);
    });

    it('isStablecoin() returns true only for STABLECOIN', () => {
      expect(Asset.stablecoin('USDT').isStablecoin()).toBe(true);
      expect(Asset.crypto('BTC').isStablecoin()).toBe(false);
      expect(Asset.fiat('USD').isStablecoin()).toBe(false);
      expect(Asset.from('USDT').isStablecoin()).toBe(false);
    });

    it('isFiat() returns true only for FIAT', () => {
      expect(Asset.fiat('USD').isFiat()).toBe(true);
      expect(Asset.crypto('BTC').isFiat()).toBe(false);
      expect(Asset.stablecoin('USDT').isFiat()).toBe(false);
      expect(Asset.from('USD').isFiat()).toBe(false);
    });

    it('isVolatile() returns true for crypto assets', () => {
      expect(Asset.crypto('BTC').isVolatile()).toBe(true);
      expect(Asset.stablecoin('USDT').isVolatile()).toBe(false);
      expect(Asset.fiat('USD').isVolatile()).toBe(false);
    });
  });

  // ============================================
  // Comparison
  // ============================================

  describe('equals()', () => {
    it('returns true for same symbol', () => {
      const btc1 = Asset.from('BTC');
      const btc2 = Asset.from('BTC');

      expect(btc1.equals(btc2)).toBe(true);
    });

    it('returns true for same symbol regardless of type', () => {
      const btc1 = Asset.crypto('BTC');
      const btc2 = Asset.from('BTC', AssetType.UNKNOWN);

      expect(btc1.equals(btc2)).toBe(true);
    });

    it('returns false for different symbols', () => {
      const btc = Asset.from('BTC');
      const eth = Asset.from('ETH');

      expect(btc.equals(eth)).toBe(false);
    });

    it('compares normalized symbols', () => {
      const btc1 = Asset.from('btc');
      const btc2 = Asset.from('BTC');

      expect(btc1.equals(btc2)).toBe(true);
    });
  });

  // ============================================
  // Display
  // ============================================

  describe('toString()', () => {
    it('returns symbol', () => {
      const asset = Asset.from('BTC');

      expect(asset.toString()).toBe('BTC');
    });

    it('returns normalized symbol', () => {
      const asset = Asset.from('btc');

      expect(asset.toString()).toBe('BTC');
    });
  });

  describe('toJSON()', () => {
    it('serializes symbol and type', () => {
      const asset = Asset.crypto('BTC');

      expect(asset.toJSON()).toEqual({
        symbol: 'BTC',
        type: AssetType.CRYPTOCURRENCY,
      });
    });

    it('includes UNKNOWN type when not specified', () => {
      const asset = Asset.from('BTC');

      expect(asset.toJSON()).toEqual({
        symbol: 'BTC',
        type: AssetType.UNKNOWN,
      });
    });
  });

  // ============================================
  // Immutability
  // ============================================

  describe('value object behavior', () => {
    it('factory methods create new instances', () => {
      const btc1 = Asset.from('BTC');
      const btc2 = Asset.from('BTC');

      expect(btc1).not.toBe(btc2); // different instances
      expect(btc1.equals(btc2)).toBe(true); // same value
    });

    it('equality is based on symbol, not reference', () => {
      const crypto = Asset.crypto('BTC');
      const unknown = Asset.from('BTC');

      expect(crypto.equals(unknown)).toBe(true); // symbol match
      expect(crypto.type).not.toBe(unknown.type); // type differs, equality ignores it
    });
  });

  // ============================================
  // Edge Cases
  // ============================================

  describe('edge cases', () => {
    it('handles single-character symbols', () => {
      const asset = Asset.from('X');

      expect(asset.symbol).toBe('X');
    });

    it('handles numeric-only symbols', () => {
      const asset = Asset.from('1234');

      expect(asset.symbol).toBe('1234');
    });

    it('handles mixed alphanumeric', () => {
      const asset = Asset.from('BTC2X');

      expect(asset.symbol).toBe('BTC2X');
    });
  });
});
