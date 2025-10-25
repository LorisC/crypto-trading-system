import { Amount } from '@domain/value-objects/amount.vo';
import { Price } from '@domain/value-objects/price.vo';
import { Timestamp } from '@domain/value-objects/timestamp.vo';
import { InvalidValueObjectException } from '@domain/exceptions';
import { ExchangeOrderId } from '@domain/value-objects/exchange-order-id';
import { TradingPair } from '@domain/value-objects/tading-pair.vo';

export interface FillParams {
  pair: TradingPair;
  exchangeOrderId: ExchangeOrderId;
  executedQuantity: Amount;
  executionPrice: Price;
  fee: Amount;
  timestamp: Timestamp;
  tradeId: string; // Exchange's unique trade identifier
}

/**
 * Fill Value Object
 *
 * Represents actual execution from exchange.
 * Critical for audit trail and P&L calculation.
 *
 * Immutable record of what actually happened on exchange.
 */
export class Fill {
  private constructor(
    public readonly pair: TradingPair,
    public readonly exchangeOrderId: ExchangeOrderId,
    public readonly executedQuantity: Amount,
    public readonly executionPrice: Price,
    public readonly fee: Amount,
    public readonly timestamp: Timestamp,
    public readonly tradeId: string,
  ) {
    // Validate executed quantity is positive
    if (!executedQuantity.isValidSize()) {
      throw new InvalidValueObjectException(
        'Fill',
        'Executed quantity must be positive',
        executedQuantity.value,
      );
    }

    // Validate executed quantity asset matches pair base
    if (!executedQuantity.asset.equals(pair.base)) {
      throw new InvalidValueObjectException(
        'Fill',
        `Executed quantity asset ${executedQuantity.asset.symbol} does not match pair base ${pair.base.symbol}`,
        executedQuantity.value,
      );
    }

    // Validate fee is non-negative
    if (!fee.isValidVolume()) {
      throw new InvalidValueObjectException(
        'Fill',
        'Fee cannot be negative',
        fee.value,
      );
    }

    // Validate trade ID
    if (!tradeId || tradeId.trim().length === 0) {
      throw new InvalidValueObjectException(
        'Fill',
        'Trade ID cannot be empty',
        tradeId,
      );
    }
  }

  static from(params: FillParams): Fill {
    return new Fill(
      params.pair,
      params.exchangeOrderId,
      params.executedQuantity,
      params.executionPrice,
      params.fee,
      params.timestamp,
      params.tradeId,
    );
  }

  /**
   * Calculate gross total (quantity * price)
   */
  calculateGrossTotal(): Amount {
    return Amount.from(
      this.executedQuantity.value * this.executionPrice.value,
      this.pair.quote,
    );
  }

  /**
   * Calculate net total after fees
   *
   * For BUY: cost = (quantity * price) + fee
   * For SELL: proceeds = (quantity * price) - fee
   *
   * Note: Fee must be in quote asset for this calculation
   */
  calculateNetTotal(): Amount {
    const gross = this.calculateGrossTotal();

    // If fee is in different asset, this needs conversion
    // For now, assume fee is in quote asset (common for spot trading)
    if (!this.fee.asset.equals(this.pair.quote)) {
      throw new InvalidValueObjectException(
        'Fill',
        `Fee asset ${this.fee.asset.symbol} must match quote asset ${this.pair.quote.symbol} for net calculation`,
        this.fee.value,
      );
    }

    // For accurate accounting, track fee separately
    // Net total represents the quote asset flow
    return gross;
  }

  /**
   * Check if this fill matches an order
   */
  matchesOrder(exchangeOrderId: ExchangeOrderId): boolean {
    return this.exchangeOrderId.equals(exchangeOrderId);
  }

  toString(): string {
    return `Fill: ${this.executedQuantity.format()} @ ${this.executionPrice.format()} (fee: ${this.fee.format()})`;
  }

  toJSON() {
    return {
      pair: this.pair.toSymbol(),
      exchangeOrderId: this.exchangeOrderId.toJSON(),
      executedQuantity: this.executedQuantity.toJSON(),
      executionPrice: this.executionPrice.toJSON(),
      fee: this.fee.toJSON(),
      timestamp: this.timestamp.toJSON(),
      tradeId: this.tradeId,
      grossTotal: this.calculateGrossTotal().toJSON(),
    };
  }
}
