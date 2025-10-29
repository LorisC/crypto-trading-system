import {
  InvalidValueObjectException,
  InvalidOperationException,
} from '@domain/exceptions';
import { Asset } from '@domain/value-objects/asset.vo';
import { Decimal } from 'decimal.js';

/**
 * Represents an amount of a specific asset (quantity + asset)
 *
 * Examples:
 * - 1.5 BTC
 * - 1000 USDT
 * - 0.01 ETH
 *
 * Rules:
 * - Must be >= 0 (non-negative)
 * - Arithmetic only allowed between same assets
 * - Immutable
 */
export class Amount {
  private constructor(
    public readonly _value: Decimal,
    public readonly asset: Asset,
  ) {}

  // ============================================
  // Creation
  // ============================================

  static from(value: number | string, asset: Asset): Amount {
    const decimal = new Decimal(value);
    if (!decimal.isFinite()) {
      throw new InvalidValueObjectException(
        'Amount',
        'Value must be a finite number',
        value,
      );
    }

    return new Amount(decimal, asset);
  }

  static zero(asset: Asset): Amount {
    return new Amount(new Decimal(0), asset);
  }

  get value(): number {
    return this._value.toNumber();
  }

  // ============================================
  // Arithmetic
  // ============================================

  add(other: Amount): Amount {
    this.assertSameAsset(other);
    return Amount.from(this.value + other.value, this.asset);
  }

  subtract(other: Amount): Amount {
    this.assertSameAsset(other);
    return Amount.from(this.value - other.value, this.asset);
  }

  /**
   * Subtract, but floor at zero (never go negative)
   * Useful for: balance -= fee (don't allow negative balance)
   */
  subtractOrZero(other: Amount): Amount {
    this.assertSameAsset(other);
    const result = this.value - other.value;
    return Amount.from(Math.max(0, result), this.asset);
  }

  multiply(factor: number): Amount {
    if (!isFinite(factor)) {
      throw new InvalidValueObjectException(
        'Amount.multiply',
        'Factor must be finite',
        factor,
      );
    }
    return Amount.from(this.value * factor, this.asset);
  }

  divide(divisor: number): Amount {
    if (divisor === 0) {
      throw new InvalidValueObjectException(
        'Amount.divide',
        'Cannot divide by zero',
      );
    }
    if (!isFinite(divisor)) {
      throw new InvalidValueObjectException(
        'Amount.divide',
        'Divisor must be finite',
        divisor,
      );
    }
    return Amount.from(this.value / divisor, this.asset);
  }

  /**
   * Return absolute value
   * Example: -100 USDT → 100 USDT
   */
  abs(): Amount {
    return Amount.from(Math.abs(this.value), this.asset);
  }

  /**
   * Return the negative of this amount
   * Example: 100 USDT → -100 USDT
   */
  negate(): Amount {
    return Amount.from(-this.value, this.asset);
  }

  /**
   * Calculate percentage of this amount
   * Example: 100 USDT.percentageOf(10) → 10 USDT
   */
  percentageOf(percentage: number): Amount {
    if (percentage < 0 || percentage > 100) {
      throw new InvalidOperationException(
        'percentageOf',
        'Percentage must be between 0 and 100',
      );
    }

    return this.multiply(percentage / 100);
  }

  // ============================================
  // Comparison
  // ============================================

  isZero(): boolean {
    return this.value === 0;
  }

  isPositive(): boolean {
    return this.value > 0;
  }

  isNegative(): boolean {
    return this.value < 0;
  }

  /**
   * Check if this is a valid "size" (positive, non-zero)
   * Use this for order sizes, position sizes, etc.
   */
  isValidSize(): boolean {
    return this.value > 0;
  }

  /**
   * Check if this is a valid "volume" (non-negative)
   * Use this for trade volumes, kline volumes
   */
  isValidVolume(): boolean {
    return this.value >= 0;
  }

  greaterThan(other: Amount): boolean {
    this.assertSameAsset(other);
    return this.value > other.value;
  }

  greaterThanOrEqual(other: Amount): boolean {
    this.assertSameAsset(other);
    return this.value >= other.value;
  }

  lessThan(other: Amount): boolean {
    this.assertSameAsset(other);
    return this.value < other.value;
  }

  lessThanOrEqual(other: Amount): boolean {
    this.assertSameAsset(other);
    return this.value <= other.value;
  }

  equals(other: Amount): boolean {
    return this.asset.equals(other.asset) && this.value === other.value;
  }

  // ============================================
  // Guards
  // ============================================

  private assertSameAsset(other: Amount): void {
    if (!this.asset.equals(other.asset)) {
      throw new InvalidValueObjectException(
        'Amount',
        'Cannot operate on amounts with different assets',
        {
          thisAsset: this.asset.symbol,
          otherAsset: other.asset.symbol,
        },
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
    return `${valueStr} ${this.asset.symbol}`;
  }

  toString(): string {
    return this.format();
  }

  toJSON() {
    return {
      value: this.value,
      asset: this.asset.symbol,
    };
  }
}
