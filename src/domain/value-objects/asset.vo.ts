import { InvalidValueObjectException } from '@domain/exceptions';
import { AssetType } from '@domain/enum';

/**
 * Represents a tradable asset identity
 *
 * Philosophy:
 * - Asset is just a symbol (BTC, ETH, USDT)
 * - Type is optional metadata (configurable externally)
 * - No hardcoded lists - classification comes from registry
 *
 * Examples:
 * - Asset.from('BTC') → Asset with UNKNOWN type
 * - Asset.crypto('BTC') → Asset explicitly marked as crypto
 */
export class Asset {
  private constructor(
    public readonly symbol: string,
    public readonly type: AssetType = AssetType.UNKNOWN,
  ) {}

  // ============================================
  // Creation
  // ============================================

  static from(symbol: string, type: AssetType = AssetType.UNKNOWN): Asset {
    const normalized = symbol.trim().toUpperCase();

    if (!normalized) {
      throw new InvalidValueObjectException(
        'Asset',
        'Symbol cannot be empty',
        symbol,
      );
    }

    if (!/^[A-Z0-9]+$/.test(normalized)) {
      throw new InvalidValueObjectException(
        'Asset',
        'Symbol must contain only uppercase letters and numbers',
        symbol,
      );
    }

    if (normalized.length > 10) {
      throw new InvalidValueObjectException(
        'Asset',
        'Symbol too long (max 10 characters)',
        symbol,
      );
    }

    return new Asset(normalized, type);
  }

  // Convenience factories
  static crypto(symbol: string): Asset {
    return Asset.from(symbol, AssetType.CRYPTOCURRENCY);
  }

  static stablecoin(symbol: string): Asset {
    return Asset.from(symbol, AssetType.STABLECOIN);
  }

  static fiat(symbol: string): Asset {
    return Asset.from(symbol, AssetType.FIAT);
  }

  // ============================================
  // Queries
  // ============================================

  isCrypto(): boolean {
    return this.type === AssetType.CRYPTOCURRENCY;
  }

  isStablecoin(): boolean {
    return this.type === AssetType.STABLECOIN;
  }

  isFiat(): boolean {
    return this.type === AssetType.FIAT;
  }

  isVolatile(): boolean {
    return this.isCrypto();
  }

  // ============================================
  // Comparison
  // ============================================

  equals(other: Asset): boolean {
    return this.symbol === other.symbol;
  }

  // ============================================
  // Display
  // ============================================

  toString(): string {
    return this.symbol;
  }

  toJSON() {
    return {
      symbol: this.symbol,
      type: this.type,
    };
  }
}
