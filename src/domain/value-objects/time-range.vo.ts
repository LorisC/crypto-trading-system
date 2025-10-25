import { InvalidValueObjectException } from '@domain/exceptions';
import { Timestamp } from '@domain/value-objects/timestamp.vo';
import { Timeframe } from '@domain/value-objects/timeframe.vo';

/**
 * TimeRange Value Object
 *
 * Represents a period between two timestamps.
 *
 * Use cases:
 * - Fetch historical klines/candles
 * - Backtest date ranges
 * - Calculate metrics over time periods
 * - Validate order lifetimes
 *
 * Rules:
 * - End must be after start
 * - Immutable
 */
export class TimeRange {
  private constructor(
    private readonly startTime: Timestamp,
    private readonly endTime: Timestamp,
  ) {}

  // ============================================
  // Creation
  // ============================================

  static from(start: Timestamp, end: Timestamp): TimeRange {
    if (end.isBeforeOrEqual(start)) {
      throw new InvalidValueObjectException(
        'TimeRange',
        'End time must be after start time',
        { start: start.toISOString(), end: end.toISOString() },
      );
    }

    return new TimeRange(start, end);
  }

  /**
   * Create range from start + duration
   */
  static fromDuration(start: Timestamp, durationMs: number): TimeRange {
    if (durationMs <= 0) {
      throw new InvalidValueObjectException(
        'TimeRange',
        'Duration must be positive',
        durationMs,
      );
    }

    const end = start.addMilliseconds(durationMs);
    return new TimeRange(start, end);
  }

  /**
   * Create range for last N timeframes before now
   *
   * Example: TimeRange.lastPeriods(Timeframe.oneHour(), 24) → last 24 hours
   */
  static lastPeriods(timeframe: Timeframe, count: number): TimeRange {
    if (count <= 0) {
      throw new InvalidValueObjectException(
        'TimeRange',
        'Count must be positive',
        count,
      );
    }

    const now = Timestamp.now();
    const aligned = now.alignTo(timeframe);
    const start = aligned.subtractMilliseconds(
      timeframe.toMilliseconds() * count,
    );

    return new TimeRange(start, aligned);
  }

  /**
   * Create range for today (00:00:00 to 23:59:59)
   */
  static today(): TimeRange {
    const now = new Date();
    const start = Timestamp.fromDate(
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
    );
    const end = Timestamp.fromDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      ),
    );
    return new TimeRange(start, end);
  }

  /**
   * Create range for yesterday
   */
  static yesterday(): TimeRange {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const start = Timestamp.fromDate(
      new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const end = Timestamp.fromDate(
      new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(),
        23,
        59,
        59,
        999,
      ),
    );
    return new TimeRange(start, end);
  }

  // ============================================
  // Queries
  // ============================================

  getStart(): Timestamp {
    return this.startTime;
  }

  getEnd(): Timestamp {
    return this.endTime;
  }

  /**
   * Duration in milliseconds
   */
  getDurationMs(): number {
    return this.endTime.toMilliseconds() - this.startTime.toMilliseconds();
  }

  /**
   * Duration in seconds
   */
  getDurationSeconds(): number {
    return this.getDurationMs() / 1000;
  }

  /**
   * Duration in minutes
   */
  getDurationMinutes(): number {
    return this.getDurationSeconds() / 60;
  }

  /**
   * Duration in hours
   */
  getDurationHours(): number {
    return this.getDurationMinutes() / 60;
  }

  /**
   * Duration in days
   */
  getDurationDays(): number {
    return this.getDurationHours() / 24;
  }

  /**
   * How many periods of this timeframe fit in this range?
   */
  countPeriods(timeframe: Timeframe): number {
    return timeframe.periodsBetween(
      this.startTime.toMilliseconds(),
      this.endTime.toMilliseconds(),
    );
  }

  // ============================================
  // Checks
  // ============================================

  /**
   * Does this range contain the timestamp?
   */
  contains(timestamp: Timestamp): boolean {
    return timestamp.isBetween(this.startTime, this.endTime);
  }

  /**
   * Does this range overlap with another?
   */
  overlaps(other: TimeRange): boolean {
    return (
      this.startTime.isBefore(other.endTime) &&
      other.startTime.isBefore(this.endTime)
    );
  }

  /**
   * Is this range completely within another?
   */
  isWithin(other: TimeRange): boolean {
    return (
      this.startTime.isAfterOrEqual(other.startTime) &&
      this.endTime.isBeforeOrEqual(other.endTime)
    );
  }

  // ============================================
  // Modifications
  // ============================================

  /**
   * Extend the range by adding time to the end
   */
  extendBy(ms: number): TimeRange {
    return new TimeRange(this.startTime, this.endTime.addMilliseconds(ms));
  }

  /**
   * Shift the entire range forward/backward in time
   */
  shift(ms: number): TimeRange {
    return new TimeRange(
      this.startTime.addMilliseconds(ms),
      this.endTime.addMilliseconds(ms),
    );
  }

  /**
   * Split range into smaller ranges of given timeframe
   *
   * Example: Range of 1 day split by 1 hour → 24 ranges
   */
  splitByTimeframe(timeframe: Timeframe): TimeRange[] {
    const ranges: TimeRange[] = [];
    let current = this.startTime.alignTo(timeframe);

    while (current.isBefore(this.endTime)) {
      const next = current.addTimeframe(timeframe);
      const rangeEnd = next.isAfter(this.endTime) ? this.endTime : next;
      ranges.push(new TimeRange(current, rangeEnd));
      current = next;
    }

    return ranges;
  }

  // ============================================
  // Display
  // ============================================

  toString(): string {
    return `${this.startTime.toISOString()} → ${this.endTime.toISOString()}`;
  }

  toJSON() {
    return {
      start: this.startTime.toJSON(),
      end: this.endTime.toJSON(),
      durationMs: this.getDurationMs(),
      durationHours: this.getDurationHours(),
    };
  }
}
