import { InvalidValueObjectException } from '@domain/exceptions';
import { Asset } from '@domain/value-objects/asset.vo';

/**
 * Represents a trading pair (base/quote)
 *
 * Examples:
 * - BTC/USDT → base: BTC, quote: USDT
 * - ETH/BTC → base: ETH, quote: BTC
 *
 * Rules:
 * - Base and quote must be different assets
 * - Immutable
 * - Has canonical string representation
 */
export class TradingPair {
  private constructor(
    public readonly base: Asset,
    public readonly quote: Asset,
  ) {}

  // ============================================
  // Creation
  // ============================================

  static from(base: Asset, quote: Asset): TradingPair {
    if (base.equals(quote)) {
      throw new InvalidValueObjectException(
        'TradingPair',
        'Base and quote assets must be different',
        { base: base.symbol, quote: quote.symbol },
      );
    }

    return new TradingPair(base, quote);
  }

  static fromSymbol(symbol: string): TradingPair {
    const parts = symbol.split('/');

    if (parts.length !== 2) {
      throw new InvalidValueObjectException(
        'TradingPair',
        'Symbol must be in format BASE/QUOTE',
        symbol,
      );
    }

    const [baseSymbol, quoteSymbol] = parts;
    const base = Asset.from(baseSymbol.trim());
    const quote = Asset.from(quoteSymbol.trim());

    return TradingPair.from(base, quote);
  }

  // ============================================
  // Queries
  // ============================================

  /**
   * Is this pair a stablecoin pair? (e.g., USDT/USDC)
   */
  isStablePair(): boolean {
    return this.base.isStablecoin() && this.quote.isStablecoin();
  }

  /**
   * Is this pair quoted in a stablecoin? (e.g., BTC/USDT)
   */
  isStableQuoted(): boolean {
    return this.quote.isStablecoin();
  }

  /**
   * Is this pair quoted in fiat? (e.g., BTC/USD)
   */
  isFiatQuoted(): boolean {
    return this.quote.isFiat();
  }

  /**
   * Is this a crypto-to-crypto pair? (e.g., ETH/BTC)
   */
  isCryptoPair(): boolean {
    return this.base.isCrypto() && this.quote.isCrypto();
  }

  // ============================================
  // Operations
  // ============================================

  /**
   * Get the inverse pair (BTC/USDT → USDT/BTC)
   */
  inverse(): TradingPair {
    return TradingPair.from(this.quote, this.base);
  }

  // ============================================
  // Comparison
  // ============================================

  equals(other: TradingPair): boolean {
    return this.base.equals(other.base) && this.quote.equals(other.quote);
  }

  // ============================================
  // Display
  // ============================================

  toSymbol(): string {
    return `${this.base.symbol}/${this.quote.symbol}`;
  }

  toString(): string {
    return this.toSymbol();
  }

  toJSON() {
    return {
      symbol: this.toSymbol(),
      base: this.base.symbol,
      quote: this.quote.symbol,
    };
  }
}
