import { InvalidValueObjectException } from '@domain/exceptions';
import { Timeframe } from '@domain/value-objects/timeframe.vo';

/**
 * Timestamp Value Object
 *
 * Represents a precise moment in time (Unix milliseconds).
 *
 * Rules:
 * - Must be > 0
 * - Must be <= now + 1 year (prevent far-future bugs)
 * - Immutable
 *
 * Use cases:
 * - Kline/candle open times
 * - Order placement times
 * - Position entry/exit times
 * - Event timestamps
 */
export class Timestamp {
  private constructor(private readonly value: number) {}

  // ============================================
  // Creation
  // ============================================

  /**
   * Create from Unix milliseconds
   */
  static fromMilliseconds(ms: number): Timestamp {
    if (!Number.isFinite(ms)) {
      throw new InvalidValueObjectException(
        'Timestamp',
        'Value must be a finite number',
        ms,
      );
    }

    if (ms <= 0) {
      throw new InvalidValueObjectException(
        'Timestamp',
        'Value must be positive',
        ms,
      );
    }

    // Prevent far-future timestamps (likely a bug)
    const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
    if (ms > oneYearFromNow) {
      throw new InvalidValueObjectException(
        'Timestamp',
        'Value is more than 1 year in the future (likely a bug)',
        ms,
      );
    }

    return new Timestamp(ms);
  }

  /**
   * Create from Unix seconds
   */
  static fromSeconds(seconds: number): Timestamp {
    return Timestamp.fromMilliseconds(seconds * 1000);
  }

  /**
   * Create from Date object
   */
  static fromDate(date: Date): Timestamp {
    return Timestamp.fromMilliseconds(date.getTime());
  }

  /**
   * Create from ISO string
   */
  static fromISO(iso: string): Timestamp {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      throw new InvalidValueObjectException(
        'Timestamp',
        'Invalid ISO string',
        iso,
      );
    }
    return Timestamp.fromDate(date);
  }

  /**
   * Current moment
   */
  static now(): Timestamp {
    return new Timestamp(Date.now());
  }

  // ============================================
  // Conversions
  // ============================================

  toMilliseconds(): number {
    return this.value;
  }

  toSeconds(): number {
    return Math.floor(this.value / 1000);
  }

  toDate(): Date {
    return new Date(this.value);
  }

  toISOString(): string {
    return this.toDate().toISOString();
  }

  // ============================================
  // Arithmetic
  // ============================================

  /**
   * Add milliseconds
   */
  addMilliseconds(ms: number): Timestamp {
    return Timestamp.fromMilliseconds(this.value + ms);
  }

  /**
   * Add seconds
   */
  addSeconds(seconds: number): Timestamp {
    return this.addMilliseconds(seconds * 1000);
  }

  /**
   * Add minutes
   */
  addMinutes(minutes: number): Timestamp {
    return this.addSeconds(minutes * 60);
  }

  /**
   * Add hours
   */
  addHours(hours: number): Timestamp {
    return this.addMinutes(hours * 60);
  }

  /**
   * Add days
   */
  addDays(days: number): Timestamp {
    return this.addHours(days * 24);
  }

  /**
   * Add a timeframe duration
   */
  addTimeframe(timeframe: Timeframe, count: number = 1): Timestamp {
    return this.addMilliseconds(timeframe.toMilliseconds() * count);
  }

  /**
   * Subtract milliseconds
   */
  subtractMilliseconds(ms: number): Timestamp {
    return Timestamp.fromMilliseconds(this.value - ms);
  }

  /**
   * Subtract seconds
   */
  subtractSeconds(seconds: number): Timestamp {
    return this.subtractMilliseconds(seconds * 1000);
  }

  /**
   * Get milliseconds between this and another timestamp
   */
  millisecondsUntil(other: Timestamp): number {
    return other.value - this.value;
  }

  /**
   * Get seconds between this and another timestamp
   */
  secondsUntil(other: Timestamp): number {
    return this.millisecondsUntil(other) / 1000;
  }

  // ============================================
  // Alignment
  // ============================================

  /**
   * Align to timeframe boundary (floor)
   *
   * Example: 10:37:42 aligned to 15m → 10:30:00
   */
  alignTo(timeframe: Timeframe): Timestamp {
    const aligned = timeframe.alignTimestamp(this.value);
    return new Timestamp(aligned);
  }

  /**
   * Get start of next timeframe period
   */
  nextPeriodStart(timeframe: Timeframe): Timestamp {
    const next = timeframe.getNextPeriodStart(this.value);
    return new Timestamp(next);
  }

  /**
   * Is this timestamp aligned to the timeframe?
   */
  isAlignedTo(timeframe: Timeframe): boolean {
    return timeframe.isAligned(this.value);
  }

  // ============================================
  // Comparison
  // ============================================

  isBefore(other: Timestamp): boolean {
    return this.value < other.value;
  }

  isAfter(other: Timestamp): boolean {
    return this.value > other.value;
  }

  isBeforeOrEqual(other: Timestamp): boolean {
    return this.value <= other.value;
  }

  isAfterOrEqual(other: Timestamp): boolean {
    return this.value >= other.value;
  }

  equals(other: Timestamp): boolean {
    return this.value === other.value;
  }

  /**
   * Is this timestamp between two others (inclusive)?
   */
  isBetween(start: Timestamp, end: Timestamp): boolean {
    return this.value >= start.value && this.value <= end.value;
  }

  /**
   * Is this timestamp in the past?
   */
  isPast(): boolean {
    return this.value < Date.now();
  }

  /**
   * Is this timestamp in the future?
   */
  isFuture(): boolean {
    return this.value > Date.now();
  }

  // ============================================
  // Formatting
  // ============================================

  /**
   * Format as human-readable string
   *
   * Options:
   * - dateStyle: 'full' | 'long' | 'medium' | 'short'
   * - timeStyle: 'full' | 'long' | 'medium' | 'short'
   * - locale: 'en-US', 'en-GB', etc.
   */
  format(options?: {
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
    locale?: string;
  }): string {
    return this.toDate().toLocaleString(options?.locale, {
      dateStyle: options?.dateStyle,
      timeStyle: options?.timeStyle,
    });
  }

  toString(): string {
    return this.toISOString();
  }

  toJSON() {
    return {
      milliseconds: this.value,
      seconds: this.toSeconds(),
      iso: this.toISOString(),
    };
  }
}
