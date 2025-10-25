import { TimeInterval } from '@domain/value-objects/time-interval.vo';

/**
 * Timestamp Value Object
 *
 * Represents a point in time with trading-specific behavior.
 * Immutable wrapper around Date for consistency and domain operations.
 */
export class Timestamp {
  private constructor(public readonly value: Date) {}

  static now(): Timestamp {
    return new Timestamp(new Date());
  }

  static from(date: Date): Timestamp {
    return new Timestamp(new Date(date));
  }

  static fromMilliseconds(ms: number): Timestamp {
    return new Timestamp(new Date(ms));
  }

  static fromISO(iso: string): Timestamp {
    return new Timestamp(new Date(iso));
  }

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
   * Check if this timestamp is between two others (inclusive)
   */
  isBetween(start: Timestamp, end: Timestamp): boolean {
    const time = this.value.getTime();
    return time >= start.value.getTime() && time <= end.value.getTime();
  }

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
   * Convert to Date
   */
  toDate(): Date {
    return new Date(this.value);
  }

  /**
   * Check equality
   */
  equals(other: Timestamp): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  /**
   * Format for display (can be extended with formatting options)
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
