import { TradingPair } from '@domain/value-objects/tading-pair.vo';
import {
  InvalidOperationException,
  InvalidValueObjectException,
} from '@domain/exceptions';
import { Percentage } from '@domain/value-objects/percentage.vo';
import { Amount } from '@domain/value-objects/amount.vo';
import { Decimal } from 'decimal.js';

/**
 * Represents a price in a specific trading pair
 *
 * Philosophy:
 * - Price = QUOTE per BASE (e.g., 50000 USDT/BTC)
 * - Arithmetic operations must preserve pair semantics
 * - Price + Price doesn't make sense (you can't add two exchange rates)
 * - Price * scalar makes sense (e.g., 2x the price)
 * - Price - Price returns an Amount in quote asset (price difference)
 *
 * Examples:
 * - BTC/USDT at 50000 → Price.from(50000, btcUsdtPair)
 * - ETH/BTC at 0.05 → Price.from(0.05, ethBtcPair)
 *
 * Rules:
 * - Must be > 0 (strictly positive)
 * - Tied to a specific trading pair
 * - Can only compare prices from the same pair
 * - Immutable
 */
export class Price {
  private constructor(
    public readonly _value: Decimal,
    public readonly pair: TradingPair,
  ) {}

  // ============================================
  // Creation
  // ============================================

  static from(value: number | string, pair: TradingPair): Price {
    const decimal = new Decimal(value);

    if (!decimal.isFinite()) {
      throw new InvalidValueObjectException(
        'Price',
        'Value must be a finite number',
        value,
      );
    }

    if (decimal.lte(0)) {
      throw new InvalidValueObjectException(
        'Price',
        'Value must be strictly positive',
        value,
      );
    }

    return new Price(decimal, pair);
  }

  get value(): number {
    return this._value.toNumber();
  }

  get valueDecimal(): Decimal {
    return this._value;
  }

  // ============================================
  // Arithmetic
  // ============================================

  /**
   * Calculate price difference (returns Amount in quote asset)
   *
   * Example: 52000 USDT/BTC - 50000 USDT/BTC = 2000 USDT
   *
   * This is the ONLY semantically valid price arithmetic operation.
   * Adding two prices doesn't make sense (you can't add exchange rates).
   */
  subtract(other: Price): Amount {
    this.assertSamePair(other);
    return Amount.from(this.value - other.value, this.pair.quote);
  }

  /**
   * Multiply price by a scalar
   * Example: 50000 USDT/BTC * 1.1 = 55000 USDT/BTC (10% increase)
   *
   * Use case: Applying a multiplier or calculating hypothetical prices
   */
  multiplyBy(factor: number): Price {
    if (!Number.isFinite(factor)) {
      throw new InvalidOperationException(
        'Price.multiplyBy',
        'Factor must be finite',
      );
    }

    const newValue = this.value * factor;

    if (newValue <= 0) {
      throw new InvalidOperationException(
        'Price.multiplyBy',
        `Result would be non-positive: ${newValue}`,
      );
    }

    return Price.from(newValue, this.pair);
  }

  /**
   * Divide price by a scalar
   * Example: 50000 USDT/BTC / 2 = 25000 USDT/BTC
   */
  divideBy(divisor: number): Price {
    if (divisor === 0) {
      throw new InvalidOperationException(
        'Price.divideBy',
        'Cannot divide by zero',
      );
    }

    if (!Number.isFinite(divisor)) {
      throw new InvalidOperationException(
        'Price.divideBy',
        'Divisor must be finite',
      );
    }

    const newValue = this.value / divisor;

    if (newValue <= 0) {
      throw new InvalidOperationException(
        'Price.divideBy',
        `Result would be non-positive: ${newValue}`,
      );
    }

    return Price.from(newValue, this.pair);
  }

  /**
   * Apply a percentage change
   * Example: 100 USDT/BTC + 10% = 110 USDT/BTC
   */
  applyPercentageChange(percentage: Percentage): Price {
    const multiplier = new Decimal(1).plus(percentage.toRatio());
    const newValue = this._value.times(multiplier);
    return new Price(newValue, this.pair);
  }

  /**
   * Calculate percentage change TO another price (from this price)
   * Formula: ((newPrice - thisPrice) / thisPrice) * 100
   *
   * Example:
   *   $50k -> $55k = +10% increase
   *   $55k -> $50k = -9.09% decrease
   */
  percentageChangeTo(newPrice: Price): Percentage {
    this.assertSamePair(newPrice);

    const diff = newPrice._value.minus(this._value);
    const ratio = diff.div(this._value);
    const percent = ratio.times(100);

    return Percentage.from(percent.toNumber());
  }

  /**
   * Calculate percentage change FROM another price (to this price)
   * Formula: ((thisPrice - oldPrice) / oldPrice) * 100
   *
   * Example:
   *   this=$55k, old=$50k = +10% increase
   *   this=$50k, old=$55k = -9.09% decrease
   */
  percentageChangeFrom(oldPrice: Price): Percentage {
    this.assertSamePair(oldPrice);
    const change = ((this.value - oldPrice.value) / oldPrice.value) * 100;
    return Percentage.from(change, { allowAbove100: true });
  }

  /**
   * Calculate absolute difference in quote asset
   * Example: |52000 - 50000| = 2000 USDT
   */
  absoluteDifference(other: Price): Amount {
    this.assertSamePair(other);
    const diff = Math.abs(this.value - other.value);
    return Amount.from(diff, this.pair.quote);
  }

  // ============================================
  // Conversions
  // ============================================

  /**
   * Convert base amount to quote amount
   * Example: 1 BTC at 50000 USDT/BTC = 50000 USDT
   */
  convertToQuote(baseAmount: Amount): Amount {
    if (!baseAmount.asset.equals(this.pair.base)) {
      throw new InvalidOperationException(
        'Price.convertToQuote',
        `Amount asset ${baseAmount.asset.symbol} doesn't match pair base ${this.pair.base.symbol}`,
      );
    }

    return Amount.from(baseAmount.value * this.value, this.pair.quote);
  }

  /**
   * Convert quote amount to base amount
   * Example: 50000 USDT at 50000 USDT/BTC = 1 BTC
   */
  convertToBase(quoteAmount: Amount): Amount {
    if (!quoteAmount.asset.equals(this.pair.quote)) {
      throw new InvalidOperationException(
        'Price.convertToBase',
        `Amount asset ${quoteAmount.asset.symbol} doesn't match pair quote ${this.pair.quote.symbol}`,
      );
    }

    return Amount.from(quoteAmount.value / this.value, this.pair.base);
  }

  // ============================================
  // Tick Operations (Exchange-specific)
  // ============================================

  /**
   * Round price to exchange tick size
   * Example: 50123.456 rounded to 0.01 = 50123.46
   */
  roundToTickSize(tickSize: number): Price {
    if (tickSize <= 0) {
      throw new InvalidOperationException(
        'Price.roundToTickSize',
        'Tick size must be positive',
      );
    }

    const rounded = Math.round(this.value / tickSize) * tickSize;
    return Price.from(rounded, this.pair);
  }

  /**
   * Move price by N ticks
   * Example: 100 + 5 ticks of 0.1 = 100.5
   */
  addTicks(ticks: number, tickSize: number): Price {
    if (tickSize <= 0) {
      throw new InvalidOperationException(
        'Price.addTicks',
        'Tick size must be positive',
      );
    }

    const newValue = this.value + ticks * tickSize;

    if (newValue <= 0) {
      throw new InvalidOperationException(
        'Price.addTicks',
        `Result would be non-positive: ${newValue}`,
      );
    }

    return Price.from(newValue, this.pair);
  }

  /**
   * Floor price to tick size
   * Example: 50123.456 floored to 0.01 = 50123.45
   */
  floorToTickSize(tickSize: number): Price {
    if (tickSize <= 0) {
      throw new InvalidOperationException(
        'Price.floorToTickSize',
        'Tick size must be positive',
      );
    }

    const floored = Math.floor(this.value / tickSize) * tickSize;
    return Price.from(floored, this.pair);
  }

  /**
   * Ceil price to tick size
   * Example: 50123.456 ceiled to 0.01 = 50123.46
   */
  ceilToTickSize(tickSize: number): Price {
    if (tickSize <= 0) {
      throw new InvalidOperationException(
        'Price.ceilToTickSize',
        'Tick size must be positive',
      );
    }

    const ceiled = Math.ceil(this.value / tickSize) * tickSize;
    return Price.from(ceiled, this.pair);
  }

  // ============================================
  // Comparison
  // ============================================

  greaterThan(other: Price): boolean {
    this.assertSamePair(other);
    return this.value > other.value;
  }

  greaterThanOrEqual(other: Price): boolean {
    this.assertSamePair(other);
    return this.value >= other.value;
  }

  lessThan(other: Price): boolean {
    this.assertSamePair(other);
    return this.value < other.value;
  }

  lessThanOrEqual(other: Price): boolean {
    this.assertSamePair(other);
    return this.value <= other.value;
  }

  equals(other: Price): boolean {
    return this.pair.equals(other.pair) && this.value === other.value;
  }

  /**
   * Is price between two other prices (inclusive)?
   */
  isBetween(lower: Price, upper: Price): boolean {
    this.assertSamePair(lower);
    this.assertSamePair(upper);
    return this.value >= lower.value && this.value <= upper.value;
  }

  // ============================================
  // Queries
  // ============================================

  /**
   * Get the minimum of two prices
   */
  min(other: Price): Price {
    this.assertSamePair(other);
    return this.value <= other.value ? this : other;
  }

  /**
   * Get the maximum of two prices
   */
  max(other: Price): Price {
    this.assertSamePair(other);
    return this.value >= other.value ? this : other;
  }

  // ============================================
  // Guards
  // ============================================

  private assertSamePair(other: Price): void {
    if (!this.pair.equals(other.pair)) {
      throw new InvalidValueObjectException(
        'Price operation',
        `Cannot operate on prices from different pairs: ${this.pair.toSymbol()} vs ${other.pair.toSymbol()}`,
      );
    }
  }

  // ============================================
  // Display
  // ============================================

  format(decimals?: number): string {
    const valueStr =
      decimals !== undefined
        ? this.value.toFixed(decimals)
        : this.value.toString();
    return `${valueStr}`;
  }

  toString(): string {
    return `${this.format()} ${this.pair.toSymbol()}`;
  }

  toJSON() {
    return {
      value: this.value,
      pair: this.pair.toSymbol(),
      base: this.pair.base.symbol,
      quote: this.pair.quote.symbol,
    };
  }
}
