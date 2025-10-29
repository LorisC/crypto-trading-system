import { TimeInterval } from '@domain/value-objects/time-interval.vo';
import { Timeframe } from '@domain/value-objects/timeframe.vo';

/**
 * Timestamp Value Object
 *
 * Represents a point in time with trading-specific behavior.
 * Immutable wrapper around Date for consistency and domain operations.
 */
export class Timestamp {
  private constructor(public readonly value: Date) {}

  // ============================================
  // Factory Methods
  // ============================================

  static now(): Timestamp {
    return new Timestamp(new Date());
  }

  static from(date: Date): Timestamp {
    return new Timestamp(new Date(date));
  }

  static fromDate(date: Date): Timestamp {
    return new Timestamp(new Date(date));
  }

  static fromMilliseconds(ms: number): Timestamp {
    return new Timestamp(new Date(ms));
  }

  static fromISO(iso: string): Timestamp {
    return new Timestamp(new Date(iso));
  }

  // ============================================
  // Arithmetic (with TimeInterval)
  // ============================================

  /**
   * Add a time interval
   */
  add(interval: TimeInterval): Timestamp {
    const newTime = this.value.getTime() + interval.toMilliseconds();
    return new Timestamp(new Date(newTime));
  }

  /**
   * Subtract a time interval
   */
  subtract(interval: TimeInterval): Timestamp {
    const newTime = this.value.getTime() - interval.toMilliseconds();
    return new Timestamp(new Date(newTime));
  }

  // ============================================
  // Arithmetic (with raw milliseconds)
  // ============================================

  /**
   * Add milliseconds (for cases without TimeInterval)
   */
  addMilliseconds(ms: number): Timestamp {
    return new Timestamp(new Date(this.value.getTime() + ms));
  }

  /**
   * Subtract milliseconds
   */
  subtractMilliseconds(ms: number): Timestamp {
    return new Timestamp(new Date(this.value.getTime() - ms));
  }

  // ============================================
  // Arithmetic (with Timeframe)
  // ============================================

  /**
   * Add a timeframe period
   */
  addTimeframe(timeframe: Timeframe): Timestamp {
    return this.addMilliseconds(timeframe.toMilliseconds());
  }

  /**
   * Subtract a timeframe period
   */
  subtractTimeframe(timeframe: Timeframe): Timestamp {
    return this.subtractMilliseconds(timeframe.toMilliseconds());
  }

  /**
   * Align timestamp to timeframe boundary
   *
   * Example: 10:37:23 aligned to 15m → 10:30:00
   */
  alignTo(timeframe: Timeframe): Timestamp {
    const ms = this.value.getTime();
    const intervalMs = timeframe.toMilliseconds();
    const aligned = Math.floor(ms / intervalMs) * intervalMs;
    return new Timestamp(new Date(aligned));
  }

  /**
   * Check if timestamp is aligned to timeframe
   */
  isAlignedTo(timeframe: Timeframe): boolean {
    const ms = this.value.getTime();
    const intervalMs = timeframe.toMilliseconds();
    return ms % intervalMs === 0;
  }

  // ============================================
  // Difference Calculations
  // ============================================

  /**
   * Calculate difference in milliseconds (absolute value)
   */
  differenceInMilliseconds(other: Timestamp): number {
    return Math.abs(this.value.getTime() - other.value.getTime());
  }

  /**
   * Calculate difference in seconds (absolute value)
   */
  differenceInSeconds(other: Timestamp): number {
    return this.differenceInMilliseconds(other) / 1000;
  }

  /**
   * Calculate difference in minutes (absolute value)
   */
  differenceInMinutes(other: Timestamp): number {
    return this.differenceInSeconds(other) / 60;
  }

  /**
   * Calculate difference in hours (absolute value)
   */
  differenceInHours(other: Timestamp): number {
    return this.differenceInMinutes(other) / 60;
  }

  /**
   * Calculate difference in days (absolute value)
   */
  differenceInDays(other: Timestamp): number {
    return this.differenceInHours(other) / 24;
  }

  // ============================================
  // Comparisons
  // ============================================

  /**
   * Check if this timestamp is before another
   */
  isBefore(other: Timestamp): boolean {
    return this.value.getTime() < other.value.getTime();
  }

  /**
   * Check if this timestamp is after another
   */
  isAfter(other: Timestamp): boolean {
    return this.value.getTime() > other.value.getTime();
  }

  /**
   * Check if this timestamp is before or equal to another
   */
  isBeforeOrEqual(other: Timestamp): boolean {
    return this.value.getTime() <= other.value.getTime();
  }

  /**
   * Check if this timestamp is after or equal to another
   */
  isAfterOrEqual(other: Timestamp): boolean {
    return this.value.getTime() >= other.value.getTime();
  }

  /**
   * Check if this timestamp is between two others (inclusive)
   */
  isBetween(start: Timestamp, end: Timestamp): boolean {
    const time = this.value.getTime();
    return time >= start.value.getTime() && time <= end.value.getTime();
  }

  /**
   * Check if this timestamp is in the past
   */
  isPast(): boolean {
    return this.isBefore(Timestamp.now());
  }

  /**
   * Check if this timestamp is in the future
   */
  isFuture(): boolean {
    return this.isAfter(Timestamp.now());
  }

  // ============================================
  // Conversions
  // ============================================

  /**
   * Get milliseconds since epoch
   */
  toMilliseconds(): number {
    return this.value.getTime();
  }

  /**
   * Get seconds since epoch
   */
  toSeconds(): number {
    return Math.floor(this.value.getTime() / 1000);
  }

  /**
   * Convert to ISO string
   */
  toISO(): string {
    return this.value.toISOString();
  }

  /**
   * Convert to ISO string (alias for consistency)
   */
  toISOString(): string {
    return this.value.toISOString();
  }

  /**
   * Convert to Date
   */
  toDate(): Date {
    return new Date(this.value);
  }

  // ============================================
  // Equality
  // ============================================

  /**
   * Check equality
   */
  equals(other: Timestamp): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  // ============================================
  // Display
  // ============================================

  /**
   * Format for display
   */
  toString(): string {
    return this.value.toISOString();
  }

  /**
   * JSON serialization
   */
  toJSON(): string {
    return this.value.toISOString();
  }
}
