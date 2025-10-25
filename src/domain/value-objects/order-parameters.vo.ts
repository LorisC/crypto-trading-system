import { Amount } from '@domain/value-objects/amount.vo';
import { Price } from '@domain/value-objects/price.vo';
import { OrderSide } from '@domain/enum/order-side.enum';
import { OrderType } from '@domain/enum/order-type.enum';
import { InvalidValueObjectException } from '@domain/exceptions';
import { TradingPair } from '@domain/value-objects/tading-pair.vo';

/**
 * Order Parameters Value Object
 *
 * Type-safe order specifications for agent trading.
 * Validates parameters before submission to exchange.
 */
export class OrderParameters {
  private constructor(
    public readonly pair: TradingPair,
    public readonly side: OrderSide,
    public readonly type: OrderType,
    public readonly quantity: Amount,
    public readonly stopPrice?: Price,
  ) {
    // Validate quantity is positive
    if (!quantity.isValidSize()) {
      throw new InvalidValueObjectException(
        'OrderParameters',
        'Order quantity must be positive',
        quantity.value,
      );
    }

    // Validate quantity asset matches pair base
    if (!quantity.asset.equals(pair.base)) {
      throw new InvalidValueObjectException(
        'OrderParameters',
        `Quantity asset ${quantity.asset.symbol} does not match pair base ${pair.base.symbol}`,
        quantity.value,
      );
    }

    // Validate stop price exists for stop/take profit orders
    if (
      (type === OrderType.STOP_LOSS || type === OrderType.TAKE_PROFIT) &&
      !stopPrice
    ) {
      throw new InvalidValueObjectException(
        'OrderParameters',
        `Stop price required for ${type} orders`,
        undefined,
      );
    }
  }

  /**
   * Create market buy order (agent entering long position)
   */
  static marketBuy(pair: TradingPair, quantity: Amount): OrderParameters {
    return new OrderParameters(pair, OrderSide.BUY, OrderType.MARKET, quantity);
  }

  /**
   * Create market sell order (agent exiting long position)
   */
  static marketSell(pair: TradingPair, quantity: Amount): OrderParameters {
    return new OrderParameters(
      pair,
      OrderSide.SELL,
      OrderType.MARKET,
      quantity,
    );
  }

  /**
   * Create stop loss order (agent risk management)
   *
   * @param side - BUY for short protection, SELL for long protection
   */
  static stopLoss(
    pair: TradingPair,
    side: OrderSide,
    quantity: Amount,
    stopPrice: Price,
  ): OrderParameters {
    return new OrderParameters(
      pair,
      side,
      OrderType.STOP_LOSS,
      quantity,
      stopPrice,
    );
  }

  /**
   * Create take profit order (agent profit taking)
   *
   * @param side - BUY for short profit, SELL for long profit
   */
  static takeProfit(
    pair: TradingPair,
    side: OrderSide,
    quantity: Amount,
    takeProfitPrice: Price,
  ): OrderParameters {
    return new OrderParameters(
      pair,
      side,
      OrderType.TAKE_PROFIT,
      quantity,
      takeProfitPrice,
    );
  }

  /**
   * Calculate estimated order value (quantity * price)
   * For market orders, price must be provided (current market price)
   */
  calculateEstimatedValue(marketPrice: Price): Amount {
    const price = this.stopPrice || marketPrice;
    return Amount.from(this.quantity.value * price.value, this.pair.quote);
  }

  /**
   * Check if order is a market order
   */
  isMarketOrder(): boolean {
    return this.type === OrderType.MARKET;
  }

  /**
   * Check if order is a stop/protection order
   */
  isStopOrder(): boolean {
    return (
      this.type === OrderType.STOP_LOSS || this.type === OrderType.TAKE_PROFIT
    );
  }

  toString(): string {
    const base = `${this.type} ${this.side} ${this.quantity.format()} ${this.pair.toSymbol()}`;
    if (this.stopPrice) {
      return `${base} @ ${this.stopPrice.format()}`;
    }
    return base;
  }

  toJSON() {
    return {
      pair: this.pair.toSymbol(),
      side: this.side,
      type: this.type,
      quantity: this.quantity.toJSON(),
      stopPrice: this.stopPrice?.toJSON(),
    };
  }
}
