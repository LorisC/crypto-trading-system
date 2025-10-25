import { Price, Amount } from '@domain/value-objects';
import { InvalidValueObjectException } from '@domain/exceptions';

/**
 * OrderBookLevel Value Object
 *
 * Represents a single price level in an order book.
 *
 * Structure:
 * - Price: the limit price
 * - Quantity: total amount of orders at this price
 *
 * Rules:
 * - Quantity must be > 0
 * - Price must match quantity's asset pair
 * - Immutable
 */
export class OrderBookLevel {
  private constructor(
    private readonly price: Price,
    private readonly quantity: Amount, // In base asset
  ) {}

  // ============================================
  // Creation
  // ============================================

  static from(price: Price, quantity: Amount): OrderBookLevel {
    // Validate quantity is positive
    if (quantity.isNegative() || quantity.isZero()) {
      throw new InvalidValueObjectException(
        'OrderBookLevel',
        'Quantity must be positive',
        quantity.value,
      );
    }

    // Validate quantity is in base asset
    if (!quantity.asset.equals(price.pair.base)) {
      throw new InvalidValueObjectException(
        'OrderBookLevel',
        'Quantity must be in base asset of price pair',
        {
          expected: price.pair.base.symbol,
          actual: quantity.asset.symbol,
        },
      );
    }

    return new OrderBookLevel(price, quantity);
  }

  // ============================================
  // Queries
  // ============================================

  getPrice(): Price {
    return this.price;
  }

  getQuantity(): Amount {
    return this.quantity;
  }

  /**
   * Get total value (price * quantity) in quote asset
   */
  getTotalValue(): Amount {
    return this.price.convertToQuote(this.quantity);
  }

  // ============================================
  // Comparison
  // ============================================

  equals(other: OrderBookLevel): boolean {
    return (
      this.price.equals(other.price) && this.quantity.equals(other.quantity)
    );
  }

  // ============================================
  // Display
  // ============================================

  toString(): string {
    return `${this.price.format()} × ${this.quantity.format()}`;
  }

  toJSON() {
    return {
      price: this.price.value,
      quantity: this.quantity.value,
      totalValue: this.getTotalValue().value,
    };
  }
}
