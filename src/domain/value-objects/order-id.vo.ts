import { v4 as uuidv4 } from 'uuid';
import { InvalidValueObjectException } from '@domain/exceptions';

/**
 * Order ID Value Object
 *
 * Internal unique identifier for orders.
 * Used for tracking and audit trail.
 */
export class OrderId {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new InvalidValueObjectException(
        'OrderId',
        'Order ID cannot be empty',
        value,
      );
    }
  }

  static generate(): OrderId {
    return new OrderId(uuidv4());
  }

  static from(value: string): OrderId {
    return new OrderId(value);
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}
