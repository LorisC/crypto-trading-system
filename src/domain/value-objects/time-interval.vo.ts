import { TimeIntervalType } from '@domain/enum';

/**
 * TimeInterval Value Object
 *
 * Represents a duration used for candle intervals, timeouts, and scheduling.
 * Immutable and self-validating.
 */
export class TimeInterval {
  private constructor(public readonly value: TimeIntervalType) {}

  // Factory methods for common intervals
  static oneMinute(): TimeInterval {
    return new TimeInterval(TimeIntervalType.ONE_MINUTE);
  }

  static threeMinutes(): TimeInterval {
    return new TimeInterval(TimeIntervalType.THREE_MINUTES);
  }

  static fiveMinutes(): TimeInterval {
    return new TimeInterval(TimeIntervalType.FIVE_MINUTES);
  }

  static fifteenMinutes(): TimeInterval {
    return new TimeInterval(TimeIntervalType.FIFTEEN_MINUTES);
  }

  static thirtyMinutes(): TimeInterval {
    return new TimeInterval(TimeIntervalType.THIRTY_MINUTES);
  }

  static oneHour(): TimeInterval {
    return new TimeInterval(TimeIntervalType.ONE_HOUR);
  }

  static twoHours(): TimeInterval {
    return new TimeInterval(TimeIntervalType.TWO_HOURS);
  }

  static fourHours(): TimeInterval {
    return new TimeInterval(TimeIntervalType.FOUR_HOURS);
  }

  static sixHours(): TimeInterval {
    return new TimeInterval(TimeIntervalType.SIX_HOURS);
  }

  static eightHours(): TimeInterval {
    return new TimeInterval(TimeIntervalType.EIGHT_HOURS);
  }

  static twelveHours(): TimeInterval {
    return new TimeInterval(TimeIntervalType.TWELVE_HOURS);
  }

  static oneDay(): TimeInterval {
    return new TimeInterval(TimeIntervalType.ONE_DAY);
  }

  static threeDays(): TimeInterval {
    return new TimeInterval(TimeIntervalType.THREE_DAYS);
  }

  static oneWeek(): TimeInterval {
    return new TimeInterval(TimeIntervalType.ONE_WEEK);
  }

  static oneMonth(): TimeInterval {
    return new TimeInterval(TimeIntervalType.ONE_MONTH);
  }

  /**
   * Create from string value (e.g., from API or config)
   */
  static from(value: string): TimeInterval {
    if (!Object.values(TimeIntervalType).includes(value as TimeIntervalType)) {
      throw new Error(
        `Invalid time interval: ${value}. Valid values: ${Object.values(TimeIntervalType).join(', ')}`,
      );
    }
    return new TimeInterval(value as TimeIntervalType);
  }

  /**
   * Create from milliseconds (finds closest standard interval)
   */
  static fromMilliseconds(ms: number): TimeInterval {
    const intervals = [
      { type: TimeIntervalType.ONE_MINUTE, ms: 60_000 },
      { type: TimeIntervalType.THREE_MINUTES, ms: 180_000 },
      { type: TimeIntervalType.FIVE_MINUTES, ms: 300_000 },
      { type: TimeIntervalType.FIFTEEN_MINUTES, ms: 900_000 },
      { type: TimeIntervalType.THIRTY_MINUTES, ms: 1_800_000 },
      { type: TimeIntervalType.ONE_HOUR, ms: 3_600_000 },
      { type: TimeIntervalType.TWO_HOURS, ms: 7_200_000 },
      { type: TimeIntervalType.FOUR_HOURS, ms: 14_400_000 },
      { type: TimeIntervalType.SIX_HOURS, ms: 21_600_000 },
      { type: TimeIntervalType.EIGHT_HOURS, ms: 28_800_000 },
      { type: TimeIntervalType.TWELVE_HOURS, ms: 43_200_000 },
      { type: TimeIntervalType.ONE_DAY, ms: 86_400_000 },
      { type: TimeIntervalType.THREE_DAYS, ms: 259_200_000 },
      { type: TimeIntervalType.ONE_WEEK, ms: 604_800_000 },
      { type: TimeIntervalType.ONE_MONTH, ms: 2_592_000_000 }, // ~30 days
    ];

    const closest = intervals.reduce((prev, curr) =>
      Math.abs(curr.ms - ms) < Math.abs(prev.ms - ms) ? curr : prev,
    );

    return new TimeInterval(closest.type);
  }

  /**
   * Convert to milliseconds
   */
  toMilliseconds(): number {
    const map: Record<TimeIntervalType, number> = {
      [TimeIntervalType.ONE_MINUTE]: 60_000,
      [TimeIntervalType.THREE_MINUTES]: 180_000,
      [TimeIntervalType.FIVE_MINUTES]: 300_000,
      [TimeIntervalType.FIFTEEN_MINUTES]: 900_000,
      [TimeIntervalType.THIRTY_MINUTES]: 1_800_000,
      [TimeIntervalType.ONE_HOUR]: 3_600_000,
      [TimeIntervalType.TWO_HOURS]: 7_200_000,
      [TimeIntervalType.FOUR_HOURS]: 14_400_000,
      [TimeIntervalType.SIX_HOURS]: 21_600_000,
      [TimeIntervalType.EIGHT_HOURS]: 28_800_000,
      [TimeIntervalType.TWELVE_HOURS]: 43_200_000,
      [TimeIntervalType.ONE_DAY]: 86_400_000,
      [TimeIntervalType.THREE_DAYS]: 259_200_000,
      [TimeIntervalType.ONE_WEEK]: 604_800_000,
      [TimeIntervalType.ONE_MONTH]: 2_592_000_000, // ~30 days
    };

    return map[this.value];
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
    return this.toSeconds() / 60;
  }

  /**
   * Convert to hours
   */
  toHours(): number {
    return this.toMinutes() / 60;
  }

  /**
   * Convert to days
   */
  toDays(): number {
    return this.toHours() / 24;
  }

  /**
   * Check if this interval is shorter than another
   */
  isShorterThan(other: TimeInterval): boolean {
    return this.toMilliseconds() < other.toMilliseconds();
  }

  /**
   * Check if this interval is longer than another
   */
  isLongerThan(other: TimeInterval): boolean {
    return this.toMilliseconds() > other.toMilliseconds();
  }

  /**
   * Check equality
   */
  equals(other: TimeInterval): boolean {
    return this.value === other.value;
  }

  /**
   * String representation (exchange format)
   */
  toString(): string {
    return this.value;
  }

  /**
   * Human-readable format
   */
  toHumanReadable(): string {
    const map: Record<TimeIntervalType, string> = {
      [TimeIntervalType.ONE_MINUTE]: '1 minute',
      [TimeIntervalType.THREE_MINUTES]: '3 minutes',
      [TimeIntervalType.FIVE_MINUTES]: '5 minutes',
      [TimeIntervalType.FIFTEEN_MINUTES]: '15 minutes',
      [TimeIntervalType.THIRTY_MINUTES]: '30 minutes',
      [TimeIntervalType.ONE_HOUR]: '1 hour',
      [TimeIntervalType.TWO_HOURS]: '2 hours',
      [TimeIntervalType.FOUR_HOURS]: '4 hours',
      [TimeIntervalType.SIX_HOURS]: '6 hours',
      [TimeIntervalType.EIGHT_HOURS]: '8 hours',
      [TimeIntervalType.TWELVE_HOURS]: '12 hours',
      [TimeIntervalType.ONE_DAY]: '1 day',
      [TimeIntervalType.THREE_DAYS]: '3 days',
      [TimeIntervalType.ONE_WEEK]: '1 week',
      [TimeIntervalType.ONE_MONTH]: '1 month',
    };

    return map[this.value];
  }

  /**
   * JSON serialization
   */
  toJSON(): string {
    return this.value;
  }
}
