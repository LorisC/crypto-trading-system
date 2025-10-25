import {
  InvalidValueObjectException,
  InvalidOperationException,
} from '@domain/exceptions';

/**
 * Represents a percentage value (0-100%)
 *
 * Examples:
 * - Fee: 0.1% → Percentage.from(0.1)
 * - Stop loss: -2% → Percentage.from(-2)
 * - Take profit: 5% → Percentage.from(5)
 *
 * Rules:
 * - Can be negative (for losses)
 * - Usually between -100% and +100% (configurable)
 * - Immutable
 */
export class Percentage {
  private constructor(public readonly value: number) {}

  // ============================================
  // Creation
  // ============================================

  static from(
    value: number,
    options?: { allowAbove100?: boolean },
  ): Percentage {
    if (!Number.isFinite(value)) {
      throw new InvalidValueObjectException(
        'Percentage',
        'Value must be a finite number',
        value,
      );
    }

    const maxValue = options?.allowAbove100 ? Number.MAX_SAFE_INTEGER : 100;

    if (value < -100) {
      throw new InvalidValueObjectException(
        'Percentage',
        'Cannot be less than -100%',
        value,
      );
    }

    if (value > maxValue) {
      throw new InvalidValueObjectException(
        'Percentage',
        `Cannot be greater than ${maxValue}%`,
        value,
      );
    }

    return new Percentage(value);
  }

  static zero(): Percentage {
    return new Percentage(0);
  }

  static fromRatio(ratio: number): Percentage {
    // 0.5 → 50%, 1.5 → 150%
    return Percentage.from(ratio * 100, { allowAbove100: true });
  }

  static fromBasisPoints(bps: number): Percentage {
    // 50 bps → 0.5%
    return Percentage.from(bps / 100);
  }

  // ============================================
  // Conversions
  // ============================================

  toRatio(): number {
    // 50% → 0.5
    return this.value / 100;
  }

  toBasisPoints(): number {
    // 0.5% → 50 bps
    return this.value * 100;
  }

  // ============================================
  // Arithmetic
  // ============================================

  add(other: Percentage): Percentage {
    return Percentage.from(this.value + other.value, { allowAbove100: true });
  }

  subtract(other: Percentage): Percentage {
    return Percentage.from(this.value - other.value);
  }

  multiply(factor: number): Percentage {
    if (!Number.isFinite(factor)) {
      throw new InvalidOperationException('multiply', 'Factor must be finite');
    }

    return Percentage.from(this.value * factor, { allowAbove100: true });
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

  greaterThan(other: Percentage): boolean {
    return this.value > other.value;
  }

  greaterThanOrEqual(other: Percentage): boolean {
    return this.value >= other.value;
  }

  lessThan(other: Percentage): boolean {
    return this.value < other.value;
  }

  lessThanOrEqual(other: Percentage): boolean {
    return this.value <= other.value;
  }

  equals(other: Percentage): boolean {
    return this.value === other.value;
  }

  // ============================================
  // Display
  // ============================================

  format(decimals: number = 2): string {
    return `${this.value.toFixed(decimals)}%`;
  }

  toString(): string {
    return this.format();
  }

  toJSON() {
    return this.value;
  }
}
