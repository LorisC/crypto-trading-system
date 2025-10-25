import { Timestamp } from '@domain/value-objects/timestamp.vo';
import { InvalidValueObjectException } from '@domain/exceptions';

/**
 * IndicatorValue Value Object
 *
 * Represents the result of a technical indicator calculation.
 *
 * Examples:
 * - RSI: { name: 'RSI', value: 65.5, timestamp: ... }
 * - MA: { name: 'SMA_20', value: 50000, timestamp: ... }
 * - MACD: { name: 'MACD', values: { macd: 12.5, signal: 10.2, histogram: 2.3 }, timestamp: ... }
 *
 * Supports both single-value and multi-value indicators.
 */
export class IndicatorValue {
  private constructor(
    private readonly name: string,
    private readonly timestamp: Timestamp,
    private readonly value?: number,
    private readonly values?: Record<string, number>,
  ) {}

  // ============================================
  // Creation
  // ============================================

  /**
   * Create single-value indicator result
   */
  static single(
    name: string,
    value: number,
    timestamp: Timestamp,
  ): IndicatorValue {
    if (!Number.isFinite(value)) {
      throw new InvalidValueObjectException(
        'IndicatorValue',
        'Value must be finite',
        value,
      );
    }

    return new IndicatorValue(name, timestamp, value, undefined);
  }

  /**
   * Create multi-value indicator result
   */
  static multi(
    name: string,
    values: Record<string, number>,
    timestamp: Timestamp,
  ): IndicatorValue {
    if (Object.keys(values).length === 0) {
      throw new InvalidValueObjectException(
        'IndicatorValue',
        'Must have at least one value',
      );
    }

    // Validate all values are finite
    for (const [key, val] of Object.entries(values)) {
      if (!Number.isFinite(val)) {
        throw new InvalidValueObjectException(
          'IndicatorValue',
          `Value for '${key}' must be finite`,
          val,
        );
      }
    }

    return new IndicatorValue(name, timestamp, undefined, values);
  }

  // Common indicator factories
  static rsi(value: number, timestamp: Timestamp): IndicatorValue {
    return IndicatorValue.single('RSI', value, timestamp);
  }

  static sma(
    period: number,
    value: number,
    timestamp: Timestamp,
  ): IndicatorValue {
    return IndicatorValue.single(`SMA_${period}`, value, timestamp);
  }

  static ema(
    period: number,
    value: number,
    timestamp: Timestamp,
  ): IndicatorValue {
    return IndicatorValue.single(`EMA_${period}`, value, timestamp);
  }

  static macd(
    macdLine: number,
    signalLine: number,
    histogram: number,
    timestamp: Timestamp,
  ): IndicatorValue {
    return IndicatorValue.multi(
      'MACD',
      { macd: macdLine, signal: signalLine, histogram },
      timestamp,
    );
  }

  static bollingerBands(
    upper: number,
    middle: number,
    lower: number,
    timestamp: Timestamp,
  ): IndicatorValue {
    return IndicatorValue.multi('BB', { upper, middle, lower }, timestamp);
  }

  static stochastic(
    k: number,
    d: number,
    timestamp: Timestamp,
  ): IndicatorValue {
    return IndicatorValue.multi('STOCH', { k, d }, timestamp);
  }

  // ============================================
  // Queries
  // ============================================

  getName(): string {
    return this.name;
  }

  getTimestamp(): Timestamp {
    return this.timestamp;
  }

  /**
   * Get single value (throws if multi-value)
   */
  getValue(): number {
    if (this.value === undefined) {
      throw new InvalidValueObjectException(
        'IndicatorValue.getValue',
        'This is a multi-value indicator, use getValues() instead',
      );
    }
    return this.value;
  }

  /**
   * Get all values (throws if single-value)
   */
  getValues(): Record<string, number> {
    if (this.values === undefined) {
      throw new InvalidValueObjectException(
        'IndicatorValue.getValues',
        'This is a single-value indicator, use getValue() instead',
      );
    }
    return { ...this.values };
  }

  /**
   * Get specific value by key (for multi-value indicators)
   */
  getValueByKey(key: string): number {
    if (this.values === undefined) {
      throw new InvalidValueObjectException(
        'IndicatorValue.getValueByKey',
        'This is a single-value indicator',
      );
    }

    const value = this.values[key];
    if (value === undefined) {
      throw new InvalidValueObjectException(
        'IndicatorValue.getValueByKey',
        `No value found for key: ${key}`,
        { available: Object.keys(this.values) },
      );
    }

    return value;
  }

  isSingleValue(): boolean {
    return this.value !== undefined;
  }

  isMultiValue(): boolean {
    return this.values !== undefined;
  }

  // ============================================
  // Display
  // ============================================

  toString(): string {
    if (this.isSingleValue()) {
      return `${this.name}: ${this.value}`;
    }

    const valuesStr = Object.entries(this.values!)
      .map(([key, val]) => `${key}=${val.toFixed(2)}`)
      .join(', ');

    return `${this.name}: {${valuesStr}}`;
  }

  toJSON() {
    return {
      name: this.name,
      timestamp: this.timestamp.toJSON(),
      ...(this.isSingleValue()
        ? { value: this.value }
        : { values: this.values }),
    };
  }
}
