import { TradingPair, Price, Amount } from '@domain/value-objects';
import { Timestamp } from '@domain/value-objects/timestamp.vo';
import { OrderBookLevel } from '@domain/value-objects/order-book-level.vo';
import { InvalidValueObjectException } from '@domain/exceptions';

/**
 * OrderBookSnapshot Value Object
 *
 * Represents the state of an order book at a specific timestamp.
 *
 * Structure:
 * - Bids: buy orders (descending price)
 * - Asks: sell orders (ascending price)
 * - Timestamp: when this snapshot was taken
 *
 * Rules:
 * - Bids sorted descending (highest first)
 * - Asks sorted ascending (lowest first)
 * - Best bid < best ask (no crossed book)
 * - Immutable
 *
 * Use cases:
 * - Liquidity analysis
 * - Slippage estimation
 * - Market depth visualization
 * - Execution simulation
 */
export class OrderBookSnapshotVo {
  private constructor(
    private readonly pair: TradingPair,
    private readonly bids: ReadonlyArray<OrderBookLevel>,
    private readonly asks: ReadonlyArray<OrderBookLevel>,
    private readonly timestamp: Timestamp,
  ) {}

  // ============================================
  // Creation
  // ============================================

  static from(
    pair: TradingPair,
    bids: OrderBookLevel[],
    asks: OrderBookLevel[],
    timestamp: Timestamp,
  ): OrderBookSnapshotVo {
    // Validate not empty
    if (bids.length === 0) {
      throw new InvalidValueObjectException(
        'OrderBookSnapshot',
        'Must have at least one bid level',
      );
    }

    if (asks.length === 0) {
      throw new InvalidValueObjectException(
        'OrderBookSnapshot',
        'Must have at least one ask level',
      );
    }

    // Sort bids descending (highest first)
    const sortedBids = [...bids].sort(
      (a, b) => b.getPrice().value - a.getPrice().value,
    );

    // Sort asks ascending (lowest first)
    const sortedAsks = [...asks].sort(
      (a, b) => a.getPrice().value - b.getPrice().value,
    );

    // Validate no crossed book
    const bestBid = sortedBids[0].getPrice();
    const bestAsk = sortedAsks[0].getPrice();

    if (bestBid.greaterThanOrEqual(bestAsk)) {
      throw new InvalidValueObjectException(
        'OrderBookSnapshot',
        'Crossed book detected: best bid >= best ask',
        {
          bestBid: bestBid.value,
          bestAsk: bestAsk.value,
        },
      );
    }

    return new OrderBookSnapshotVo(pair, sortedBids, sortedAsks, timestamp);
  }

  // ============================================
  // Queries
  // ============================================

  getPair(): TradingPair {
    return this.pair;
  }

  getTimestamp(): Timestamp {
    return this.timestamp;
  }

  getBids(): ReadonlyArray<OrderBookLevel> {
    return this.bids;
  }

  getAsks(): ReadonlyArray<OrderBookLevel> {
    return this.asks;
  }

  /**
   * Get best bid (highest buy order)
   */
  getBestBid(): OrderBookLevel {
    return this.bids[0];
  }

  /**
   * Get best ask (lowest sell order)
   */
  getBestAsk(): OrderBookLevel {
    return this.asks[0];
  }

  /**
   * Get mid price (average of best bid and best ask)
   */
  getMidPrice(): Price {
    const bestBid = this.getBestBid().getPrice();
    const bestAsk = this.getBestAsk().getPrice();
    const mid = (bestBid.value + bestAsk.value) / 2;
    return Price.from(mid, this.pair);
  }

  /**
   * Get spread (best ask - best bid) in quote asset
   */
  getSpread(): Amount {
    const bestBid = this.getBestBid().getPrice();
    const bestAsk = this.getBestAsk().getPrice();
    return bestAsk.subtract(bestBid);
  }

  /**
   * Get spread as percentage of mid price
   */
  getSpreadPercent(): number {
    const spread = this.getSpread();
    const mid = this.getMidPrice();
    return (spread.value / mid.value) * 100;
  }

  // ============================================
  // Liquidity Analysis
  // ============================================

  /**
   * Calculate total bid liquidity up to N levels
   */
  getBidLiquidity(levels?: number): Amount {
    const levelsToSum = levels ? this.bids.slice(0, levels) : this.bids;

    let total = 0;
    for (const level of levelsToSum) {
      total += level.getTotalValue().value;
    }

    return Amount.from(total, this.pair.quote);
  }

  /**
   * Calculate total ask liquidity up to N levels
   */
  getAskLiquidity(levels?: number): Amount {
    const levelsToSum = levels ? this.asks.slice(0, levels) : this.asks;

    let total = 0;
    for (const level of levelsToSum) {
      total += level.getTotalValue().value;
    }

    return Amount.from(total, this.pair.quote);
  }

  /**
   * Calculate liquidity imbalance (bid liquidity / ask liquidity)
   * > 1 = more buy pressure
   * < 1 = more sell pressure
   */
  getLiquidityImbalance(levels?: number): number {
    const bidLiq = this.getBidLiquidity(levels);
    const askLiq = this.getAskLiquidity(levels);

    if (askLiq.isZero()) return Infinity;

    return bidLiq.value / askLiq.value;
  }

  // ============================================
  // Execution Simulation
  // ============================================

  /**
   * Estimate slippage for a market buy of given size
   * Returns: [averageFillPrice, totalCost, slippagePercent]
   */
  estimateMarketBuy(size: Amount): {
    averagePrice: Price;
    totalCost: Amount;
    slippagePercent: number;
  } {
    if (!size.asset.equals(this.pair.base)) {
      throw new InvalidValueObjectException(
        'estimateMarketBuy',
        'Size must be in base asset',
        { expected: this.pair.base.symbol, actual: size.asset.symbol },
      );
    }

    let remaining = size.value;
    let totalCost = 0;
    let filled = 0;

    for (const level of this.asks) {
      const availableQty = level.getQuantity().value;
      const fillQty = Math.min(remaining, availableQty);

      totalCost += fillQty * level.getPrice().value;
      filled += fillQty;
      remaining -= fillQty;

      if (remaining <= 0) break;
    }

    if (remaining > 0) {
      throw new InvalidValueObjectException(
        'estimateMarketBuy',
        'Insufficient liquidity for order',
        { requested: size.value, available: filled },
      );
    }

    const averagePrice = Price.from(totalCost / filled, this.pair);
    const bestAsk = this.getBestAsk().getPrice();
    const slippage =
      ((averagePrice.value - bestAsk.value) / bestAsk.value) * 100;

    return {
      averagePrice,
      totalCost: Amount.from(totalCost, this.pair.quote),
      slippagePercent: slippage,
    };
  }

  /**
   * Estimate slippage for a market sell of given size
   */
  estimateMarketSell(size: Amount): {
    averagePrice: Price;
    totalRevenue: Amount;
    slippagePercent: number;
  } {
    if (!size.asset.equals(this.pair.base)) {
      throw new InvalidValueObjectException(
        'estimateMarketSell',
        'Size must be in base asset',
        { expected: this.pair.base.symbol, actual: size.asset.symbol },
      );
    }

    let remaining = size.value;
    let totalRevenue = 0;
    let filled = 0;

    for (const level of this.bids) {
      const availableQty = level.getQuantity().value;
      const fillQty = Math.min(remaining, availableQty);

      totalRevenue += fillQty * level.getPrice().value;
      filled += fillQty;
      remaining -= fillQty;

      if (remaining <= 0) break;
    }

    if (remaining > 0) {
      throw new InvalidValueObjectException(
        'estimateMarketSell',
        'Insufficient liquidity for order',
        { requested: size.value, available: filled },
      );
    }

    const averagePrice = Price.from(totalRevenue / filled, this.pair);
    const bestBid = this.getBestBid().getPrice();
    const slippage =
      ((bestBid.value - averagePrice.value) / bestBid.value) * 100;

    return {
      averagePrice,
      totalRevenue: Amount.from(totalRevenue, this.pair.quote),
      slippagePercent: slippage,
    };
  }

  // ============================================
  // Display
  // ============================================

  toString(): string {
    const bid = this.getBestBid().getPrice().format();
    const ask = this.getBestAsk().getPrice().format();
    const spread = this.getSpreadPercent().toFixed(3);

    return `${this.pair.toSymbol()} OrderBook: ${bid} / ${ask} (${spread}% spread)`;
  }

  toJSON() {
    return {
      pair: this.pair.toSymbol(),
      timestamp: this.timestamp.toJSON(),
      bestBid: this.getBestBid().toJSON(),
      bestAsk: this.getBestAsk().toJSON(),
      midPrice: this.getMidPrice().value,
      spread: {
        absolute: this.getSpread().value,
        percent: this.getSpreadPercent(),
      },
      liquidity: {
        bids: this.getBidLiquidity(10).value,
        asks: this.getAskLiquidity(10).value,
        imbalance: this.getLiquidityImbalance(10),
      },
      depth: {
        bids: this.bids.map((level) => level.toJSON()),
        asks: this.asks.map((level) => level.toJSON()),
      },
    };
  }
}
