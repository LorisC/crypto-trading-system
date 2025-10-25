import {
  InvalidValueObjectException,
  InvalidOperationException,
} from '@domain/exceptions';

/**
 * Represents a dimensionless numeric quantity (count, multiplier, ratio)
 *
 * Examples:
 * - Number of contracts: Quantity.from(5)
 * - Leverage: Quantity.from(10)
 * - Order count: Quantity.from(3)
 *
 * Rules:
 * - Must be >= 0 (non-negative)
 * - No asset association (use Amount for that)
 * - Immutable
 */
export class Quantity {
  private constructor(public readonly value: number) {}

  // ============================================
  // Creation
  // ============================================

  static from(value: number): Quantity {
    if (!Number.isFinite(value)) {
      throw new InvalidValueObjectException(
        'Quantity',
        'Must be a finite number',
        value,
      );
    }

    if (value < 0) {
      throw new InvalidValueObjectException(
        'Quantity',
        'Cannot be negative',
        value,
      );
    }

    return new Quantity(value);
  }

  static zero(): Quantity {
    return new Quantity(0);
  }

  static one(): Quantity {
    return new Quantity(1);
  }

  // ============================================
  // Arithmetic
  // ============================================

  add(other: Quantity): Quantity {
    return Quantity.from(this.value + other.value);
  }

  subtract(other: Quantity): Quantity {
    const result = this.value - other.value;

    if (result < 0) {
      throw new InvalidOperationException(
        'subtract',
        `Result would be negative: ${this.value} - ${other.value} = ${result}`,
      );
    }

    return Quantity.from(result);
  }

  multiply(factor: number): Quantity {
    if (!Number.isFinite(factor)) {
      throw new InvalidOperationException('multiply', 'Factor must be finite');
    }

    if (factor < 0) {
      throw new InvalidOperationException(
        'multiply',
        'Factor cannot be negative',
      );
    }

    return Quantity.from(this.value * factor);
  }

  divide(divisor: number): Quantity {
    if (!Number.isFinite(divisor)) {
      throw new InvalidOperationException('divide', 'Divisor must be finite');
    }

    if (divisor === 0) {
      throw new InvalidOperationException('divide', 'Cannot divide by zero');
    }

    if (divisor < 0) {
      throw new InvalidOperationException(
        'divide',
        'Divisor cannot be negative',
      );
    }

    return Quantity.from(this.value / divisor);
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

  greaterThan(other: Quantity): boolean {
    return this.value > other.value;
  }

  greaterThanOrEqual(other: Quantity): boolean {
    return this.value >= other.value;
  }

  lessThan(other: Quantity): boolean {
    return this.value < other.value;
  }

  lessThanOrEqual(other: Quantity): boolean {
    return this.value <= other.value;
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }

  // ============================================
  // Display
  // ============================================

  toString(): string {
    return this.value.toString();
  }

  toJSON() {
    return this.value;
  }
}
