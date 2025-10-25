import { Timeframe as TimeframeEnum } from '@domain/enum';
import { InvalidValueObjectException } from '@domain/exceptions';

/**
 * Timeframe Value Object
 *
 * Wraps the enum with utility methods for time calculations.
 *
 * Examples:
 * - Get milliseconds: Timeframe.from('1h').toMilliseconds() → 3600000
 * - Compare: tf1.isLongerThan(tf2)
 * - Validate alignment: tf.canAlignWith(timestamp)
 */
export class Timeframe {
  private constructor(private readonly value: TimeframeEnum) {}

  // ============================================
  // Creation
  // ============================================

  static from(value: string | TimeframeEnum): Timeframe {
    // If already enum, use directly
    if (Object.values(TimeframeEnum).includes(value as TimeframeEnum)) {
      return new Timeframe(value as TimeframeEnum);
    }

    throw new InvalidValueObjectException(
      'Timeframe',
      `Invalid timeframe: ${value}. Must be one of: ${Object.values(TimeframeEnum).join(', ')}`,
      value,
    );
  }

  // Common timeframes as static factories
  static oneMinute(): Timeframe {
    return new Timeframe(TimeframeEnum.ONE_MINUTE);
  }

  static fiveMinutes(): Timeframe {
    return new Timeframe(TimeframeEnum.FIVE_MINUTES);
  }

  static fifteenMinutes(): Timeframe {
    return new Timeframe(TimeframeEnum.FIFTEEN_MINUTES);
  }

  static oneHour(): Timeframe {
    return new Timeframe(TimeframeEnum.ONE_HOUR);
  }

  static fourHours(): Timeframe {
    return new Timeframe(TimeframeEnum.FOUR_HOURS);
  }

  static oneDay(): Timeframe {
    return new Timeframe(TimeframeEnum.ONE_DAY);
  }

  static oneWeek(): Timeframe {
    return new Timeframe(TimeframeEnum.ONE_WEEK);
  }

  // ============================================
  // Conversions
  // ============================================

  /**
   * Convert timeframe to milliseconds
   */
  toMilliseconds(): number {
    const multipliers: Record<TimeframeEnum, number> = {
      [TimeframeEnum.ONE_SECOND]: 1000,
      [TimeframeEnum.ONE_MINUTE]: 60 * 1000,
      [TimeframeEnum.THREE_MINUTES]: 3 * 60 * 1000,
      [TimeframeEnum.FIVE_MINUTES]: 5 * 60 * 1000,
      [TimeframeEnum.FIFTEEN_MINUTES]: 15 * 60 * 1000,
      [TimeframeEnum.THIRTY_MINUTES]: 30 * 60 * 1000,
      [TimeframeEnum.ONE_HOUR]: 60 * 60 * 1000,
      [TimeframeEnum.TWO_HOURS]: 2 * 60 * 60 * 1000,
      [TimeframeEnum.FOUR_HOURS]: 4 * 60 * 60 * 1000,
      [TimeframeEnum.SIX_HOURS]: 6 * 60 * 60 * 1000,
      [TimeframeEnum.EIGHT_HOURS]: 8 * 60 * 60 * 1000,
      [TimeframeEnum.TWELVE_HOURS]: 12 * 60 * 60 * 1000,
      [TimeframeEnum.ONE_DAY]: 24 * 60 * 60 * 1000,
      [TimeframeEnum.THREE_DAYS]: 3 * 24 * 60 * 60 * 1000,
      [TimeframeEnum.ONE_WEEK]: 7 * 24 * 60 * 60 * 1000,
      [TimeframeEnum.ONE_MONTH]: 30 * 24 * 60 * 60 * 1000, // Approximate
    };

    return multipliers[this.value];
  }

  /**
   * Convert to seconds
   */
  toSeconds(): number {
    return this.toMilliseconds() / 1000;
  }

  /**
   * Convert to minutes
   */
  toMinutes(): number {
    return this.toMilliseconds() / (60 * 1000);
  }

  /**
   * Convert to hours
   */
  toHours(): number {
    return this.toMilliseconds() / (60 * 60 * 1000);
  }

  // ============================================
  // Time Calculations
  // ============================================

  /**
   * Round timestamp down to nearest timeframe boundary
   *
   * Example:
   * - Time: 10:37:42
   * - Timeframe: 15m
   * - Result: 10:30:00
   */
  alignTimestamp(timestamp: number): number {
    const ms = this.toMilliseconds();
    return Math.floor(timestamp / ms) * ms;
  }

  /**
   * Get the start of the next period
   *
   * Example:
   * - Time: 10:37:42
   * - Timeframe: 15m
   * - Result: 10:45:00
   */
  getNextPeriodStart(timestamp: number): number {
    const aligned = this.alignTimestamp(timestamp);
    return aligned + this.toMilliseconds();
  }

  /**
   * Calculate how many periods between two timestamps
   */
  periodsBetween(startTime: number, endTime: number): number {
    const duration = endTime - startTime;
    return Math.floor(duration / this.toMilliseconds());
  }

  /**
   * Check if timestamp is aligned to this timeframe
   */
  isAligned(timestamp: number): boolean {
    return timestamp % this.toMilliseconds() === 0;
  }

  // ============================================
  // Comparison
  // ============================================

  /**
   * Is this timeframe longer than another?
   */
  isLongerThan(other: Timeframe): boolean {
    return this.toMilliseconds() > other.toMilliseconds();
  }

  /**
   * Is this timeframe shorter than another?
   */
  isShorterThan(other: Timeframe): boolean {
    return this.toMilliseconds() < other.toMilliseconds();
  }

  /**
   * Are these timeframes equal?
   */
  equals(other: Timeframe): boolean {
    return this.value === other.value;
  }

  /**
   * Can this timeframe be used as a higher timeframe for the other?
   * (Must be an exact multiple)
   *
   * Example: 1h.canAlignWith(15m) → true (1h = 4 * 15m)
   *          1h.canAlignWith(7m) → false
   */
  canAlignWith(other: Timeframe): boolean {
    const ratio = this.toMilliseconds() / other.toMilliseconds();
    return Number.isInteger(ratio);
  }

  // ============================================
  // Queries
  // ============================================

  getValue(): TimeframeEnum {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON() {
    return {
      value: this.value,
      milliseconds: this.toMilliseconds(),
      seconds: this.toSeconds(),
    };
  }
}
