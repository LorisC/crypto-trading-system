import { InvalidValueObjectException } from '@domain/exceptions';

/**
 * Exchange Order ID Value Object
 *
 * External identifier assigned by exchange (Binance/Bybit).
 * Critical for reconciliation and audit trail.
 */
export class ExchangeOrderId {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new InvalidValueObjectException(
        'ExchangeOrderId',
        'Exchange order ID cannot be empty',
        value,
      );
    }
  }

  static from(value: string): ExchangeOrderId {
    return new ExchangeOrderId(value);
  }

  equals(other: ExchangeOrderId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}
