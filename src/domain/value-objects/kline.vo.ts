import { Price, Amount, TradingPair } from '@domain/value-objects';
import { Timestamp } from '@domain/value-objects/timestamp.vo';
import { Timeframe } from '@domain/value-objects/timeframe.vo';
import { InvalidValueObjectException } from '@domain/exceptions';

/**
 * Kline (Candlestick) Value Object
 *
 * Represents OHLCV (Open, High, Low, Close, Volume) data for a time period.
 *
 * Rules:
 * - High >= Low
 * - High >= Open, Close
 * - Low <= Open, Close
 * - Volume >= 0
 * - Open time aligned to timeframe
 * - Immutable
 *
 * Use cases:
 * - Technical analysis
 * - Chart display
 * - Indicator calculations
 * - Backtesting
 */
export class Kline {
  private constructor(
    private readonly pair: TradingPair,
    private readonly timeframe: Timeframe,
    private readonly openTime: Timestamp,
    private readonly open: Price,
    private readonly high: Price,
    private readonly low: Price,
    private readonly close: Price,
    private readonly volume: Amount, // In base asset
    private readonly closeTime: Timestamp,
    private readonly quoteVolume?: Amount, // In quote asset
    private readonly trades?: number, // Number of trades
  ) {}

  // ============================================
  // Creation
  // ============================================

  static from(params: {
    pair: TradingPair;
    timeframe: Timeframe;
    openTime: Timestamp;
    open: Price;
    high: Price;
    low: Price;
    close: Price;
    volume: Amount;
    closeTime?: Timestamp;
    quoteVolume?: Amount;
    trades?: number;
  }): Kline {
    const {
      pair,
      timeframe,
      openTime,
      open,
      high,
      low,
      close,
      volume,
      closeTime,
      quoteVolume,
      trades,
    } = params;

    // Validate all prices are for the same pair
    if (!open.pair.equals(pair)) {
      throw new InvalidValueObjectException(
        'Kline',
        'Open price must match trading pair',
        { expected: pair.toSymbol(), actual: open.pair.toSymbol() },
      );
    }

    if (!high.pair.equals(pair)) {
      throw new InvalidValueObjectException(
        'Kline',
        'High price must match trading pair',
        { expected: pair.toSymbol(), actual: high.pair.toSymbol() },
      );
    }

    if (!low.pair.equals(pair)) {
      throw new InvalidValueObjectException(
        'Kline',
        'Low price must match trading pair',
        { expected: pair.toSymbol(), actual: low.pair.toSymbol() },
      );
    }

    if (!close.pair.equals(pair)) {
      throw new InvalidValueObjectException(
        'Kline',
        'Close price must match trading pair',
        { expected: pair.toSymbol(), actual: close.pair.toSymbol() },
      );
    }

    // Validate OHLC relationships
    if (high.lessThan(low)) {
      throw new InvalidValueObjectException('Kline', 'High must be >= Low', {
        high: high.value,
        low: low.value,
      });
    }

    if (high.lessThan(open)) {
      throw new InvalidValueObjectException('Kline', 'High must be >= Open', {
        high: high.value,
        open: open.value,
      });
    }

    if (high.lessThan(close)) {
      throw new InvalidValueObjectException('Kline', 'High must be >= Close', {
        high: high.value,
        close: close.value,
      });
    }

    if (low.greaterThan(open)) {
      throw new InvalidValueObjectException('Kline', 'Low must be <= Open', {
        low: low.value,
        open: open.value,
      });
    }

    if (low.greaterThan(close)) {
      throw new InvalidValueObjectException('Kline', 'Low must be <= Close', {
        low: low.value,
        close: close.value,
      });
    }

    // Validate volume is in base asset
    if (!volume.asset.equals(pair.base)) {
      throw new InvalidValueObjectException(
        'Kline',
        'Volume must be in base asset',
        { expected: pair.base.symbol, actual: volume.asset.symbol },
      );
    }

    if (volume.isNegative()) {
      throw new InvalidValueObjectException(
        'Kline',
        'Volume cannot be negative',
        volume.value,
      );
    }

    // Validate quote volume if provided
    if (quoteVolume && !quoteVolume.asset.equals(pair.quote)) {
      throw new InvalidValueObjectException(
        'Kline',
        'Quote volume must be in quote asset',
        { expected: pair.quote.symbol, actual: quoteVolume.asset.symbol },
      );
    }

    // Validate open time alignment
    if (!openTime.isAlignedTo(timeframe)) {
      throw new InvalidValueObjectException(
        'Kline',
        'Open time must be aligned to timeframe',
        {
          openTime: openTime.toISOString(),
          timeframe: timeframe.toString(),
        },
      );
    }

    // Calculate close time if not provided
    const actualCloseTime =
      closeTime || openTime.addTimeframe(timeframe).subtractMilliseconds(1);

    // Validate trades count
    if (trades !== undefined && trades < 0) {
      throw new InvalidValueObjectException(
        'Kline',
        'Trades count cannot be negative',
        trades,
      );
    }

    return new Kline(
      pair,
      timeframe,
      openTime,
      open,
      high,
      low,
      close,
      volume,
      actualCloseTime,
      quoteVolume,
      trades,
    );
  }

  // ============================================
  // Queries
  // ============================================

  getPair(): TradingPair {
    return this.pair;
  }

  getTimeframe(): Timeframe {
    return this.timeframe;
  }

  getOpenTime(): Timestamp {
    return this.openTime;
  }

  getCloseTime(): Timestamp {
    return this.closeTime;
  }

  getOpen(): Price {
    return this.open;
  }

  getHigh(): Price {
    return this.high;
  }

  getLow(): Price {
    return this.low;
  }

  getClose(): Price {
    return this.close;
  }

  getVolume(): Amount {
    return this.volume;
  }

  getQuoteVolume(): Amount | undefined {
    return this.quoteVolume;
  }

  getTrades(): number | undefined {
    return this.trades;
  }

  // ============================================
  // Derived Values
  // ============================================

  /**
   * Price range (high - low) as Amount in quote asset
   */
  getRange(): Amount {
    return this.high.subtract(this.low);
  }

  /**
   * Body range (|close - open|) as Amount in quote asset
   */
  getBodySize(): Amount {
    const diff = this.close.subtract(this.open);
    return diff.abs();
  }

  /**
   * Upper wick (high - max(open, close))
   */
  getUpperWick(): Amount {
    const bodyTop = this.close.greaterThan(this.open) ? this.close : this.open;
    return this.high.subtract(bodyTop);
  }

  /**
   * Lower wick (min(open, close) - low)
   */
  getLowerWick(): Amount {
    const bodyBottom = this.close.lessThan(this.open) ? this.close : this.open;
    return bodyBottom.subtract(this.low);
  }

  /**
   * Midpoint price ((high + low) / 2)
   */
  getMidpoint(): Price {
    const sum = this.high.value + this.low.value;
    return Price.from(sum / 2, this.pair);
  }

  /**
   * Typical price ((high + low + close) / 3)
   */
  getTypicalPrice(): Price {
    const sum = this.high.value + this.low.value + this.close.value;
    return Price.from(sum / 3, this.pair);
  }

  /**
   * Weighted close ((high + low + close + close) / 4)
   */
  getWeightedClose(): Price {
    const sum = this.high.value + this.low.value + 2 * this.close.value;
    return Price.from(sum / 4, this.pair);
  }

  /**
   * Price change (close - open) as Amount
   */
  getPriceChange(): Amount {
    return this.close.subtract(this.open);
  }

  /**
   * Price change as percentage
   */
  getPriceChangePercent(): number {
    const change = this.close.value - this.open.value;
    return (change / this.open.value) * 100;
  }

  /**
   * Average price (quote volume / base volume)
   * Returns weighted average fill price for the period
   */
  getAveragePrice(): Price | null {
    if (!this.quoteVolume || this.volume.isZero()) {
      return null;
    }
    const avgPrice = this.quoteVolume.value / this.volume.value;
    return Price.from(avgPrice, this.pair);
  }

  // ============================================
  // Candle Patterns
  // ============================================

  /**
   * Is this a bullish candle? (close > open)
   */
  isBullish(): boolean {
    return this.close.greaterThan(this.open);
  }

  /**
   * Is this a bearish candle? (close < open)
   */
  isBearish(): boolean {
    return this.close.lessThan(this.open);
  }

  /**
   * Is this a doji? (open ≈ close, small body)
   * Body size < 0.1% of high-low range
   */
  isDoji(): boolean {
    const bodySize = this.getBodySize().value;
    const range = this.getRange().value;

    if (range === 0) return true; // Flat line is technically a doji

    return bodySize / range < 0.001; // 0.1%
  }

  /**
   * Is this a hammer/inverted hammer?
   * Long lower wick (> 2x body), small upper wick
   */
  isHammer(): boolean {
    const body = this.getBodySize().value;
    const lowerWick = this.getLowerWick().value;
    const upperWick = this.getUpperWick().value;

    return lowerWick > 2 * body && upperWick < body;
  }

  /**
   * Is this a shooting star/hanging man?
   * Long upper wick (> 2x body), small lower wick
   */
  isShootingStar(): boolean {
    const body = this.getBodySize().value;
    const lowerWick = this.getLowerWick().value;
    const upperWick = this.getUpperWick().value;

    return upperWick > 2 * body && lowerWick < body;
  }

  /**
   * Is this a marubozu? (no wicks, body = range)
   * Body > 95% of range
   */
  isMarubozu(): boolean {
    const body = this.getBodySize().value;
    const range = this.getRange().value;

    if (range === 0) return false;

    return body / range > 0.95;
  }

  // ============================================
  // Comparison
  // ============================================

  /**
   * Are these klines from the same time period?
   */
  equals(other: Kline): boolean {
    return (
      this.pair.equals(other.pair) &&
      this.timeframe.equals(other.timeframe) &&
      this.openTime.equals(other.openTime)
    );
  }

  /**
   * Is this kline before another?
   */
  isBefore(other: Kline): boolean {
    return this.openTime.isBefore(other.openTime);
  }

  /**
   * Is this kline after another?
   */
  isAfter(other: Kline): boolean {
    return this.openTime.isAfter(other.openTime);
  }

  /**
   * Is this kline complete? (close time is in the past)
   */
  isComplete(): boolean {
    return this.closeTime.isPast();
  }

  // ============================================
  // Display
  // ============================================

  format(): string {
    const direction = this.isBullish() ? '📈' : this.isBearish() ? '📉' : '➡️';
    const change = this.getPriceChangePercent().toFixed(2);

    return (
      `${direction} ${this.pair.toSymbol()} [${this.timeframe.toString()}] ` +
      `O:${this.open.value} H:${this.high.value} L:${this.low.value} C:${this.close.value} ` +
      `(${parseFloat(change) > 0 ? '+' : ''}${change}%) V:${this.volume.value}`
    );
  }

  toString(): string {
    return this.format();
  }

  toJSON() {
    return {
      pair: this.pair.toSymbol(),
      timeframe: this.timeframe.toString(),
      openTime: this.openTime.toJSON(),
      closeTime: this.closeTime.toJSON(),
      open: this.open.value,
      high: this.high.value,
      low: this.low.value,
      close: this.close.value,
      volume: this.volume.value,
      quoteVolume: this.quoteVolume?.value,
      trades: this.trades,
      derived: {
        range: this.getRange().value,
        bodySize: this.getBodySize().value,
        priceChange: this.getPriceChange().value,
        priceChangePercent: this.getPriceChangePercent(),
        isBullish: this.isBullish(),
        isBearish: this.isBearish(),
        isDoji: this.isDoji(),
      },
    };
  }
}
