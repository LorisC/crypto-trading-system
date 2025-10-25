import { Amount, Price, TradingPair } from '@domain/value-objects';
import { InvalidOperationException } from '@domain/exceptions';
import { PositionExitReason, PositionSide, PositionStatus } from '@domain/enum';

/**
 * Position Entity - Tracks an open/closed trading position
 *
 * Represents the execution state of an agent's trading decision.
 * The agent decides WHAT to trade, we track WHAT HAPPENED.
 *
 * Lifecycle:
 * 1. Agent sends open command → Position created (OPENING)
 * 2. Entry order fills → Position becomes OPEN
 * 3. SL/TP hit OR agent closes → Position becomes CLOSED
 *
 * Responsibilities:
 * - Track position state (opening, open, closed)
 * - Record actual fill prices vs intended prices
 * - Calculate realized P&L when closed
 * - Enforce state transitions
 *
 * NOT responsible for:
 * - Position sizing (agent decides)
 * - Risk calculation (agent's job)
 * - When to close (agent decides)
 */

export interface PositionProps {
  id: string;
  tradingPair: TradingPair;
  side: PositionSide;

  // Intended values (what agent wanted)
  intendedEntry: Price;
  intendedStopLoss: Price;
  intendedTakeProfit: Price;
  intendedSize: Amount;

  // Actual values (what happened on exchange)
  actualEntryPrice?: Price;
  actualExitPrice?: Price;
  actualSize?: Amount;

  // Order tracking
  entryOrderId?: string;
  stopLossOrderId?: string;
  takeProfitOrderId?: string;
  exitOrderId?: string;

  // State
  status: PositionStatus;
  exitReason?: PositionExitReason;

  // P&L
  realizedPnL?: Amount;
  fees?: Amount;

  // Timestamps
  createdAt: Date;
  openedAt?: Date;
  closedAt?: Date;

  // Metadata (for agent tracking)
  agentId?: string;
  strategyId?: string;
  notes?: string;
}

export class Position {
  private constructor(private props: PositionProps) {}

  // ============================================
  // Creation (Agent opens position)
  // ============================================

  static open(params: {
    id: string;
    tradingPair: TradingPair;
    side: PositionSide;
    intendedEntry: Price;
    intendedStopLoss: Price;
    intendedTakeProfit: Price;
    intendedSize: Amount;
    agentId?: string;
    strategyId?: string;
  }): Position {
    // Type guard: ensure params are defined
    if (!params) {
      throw new InvalidOperationException(
        'Position.open',
        'Position parameters are required',
      );
    }

    // Type guard: ensure required properties exist
    if (
      !params.intendedEntry ||
      !params.intendedStopLoss ||
      !params.intendedTakeProfit ||
      !params.intendedSize
    ) {
      throw new InvalidOperationException(
        'Position.open',
        'All price levels and size are required',
      );
    }

    // Validate: all prices are in same pair
    if (!params.intendedEntry.pair.equals(params.tradingPair)) {
      throw new InvalidOperationException(
        'Position.open',
        'Entry price must match trading pair',
      );
    }

    if (!params.intendedStopLoss.pair.equals(params.tradingPair)) {
      throw new InvalidOperationException(
        'Position.open',
        'Stop loss price must match trading pair',
      );
    }

    if (!params.intendedTakeProfit.pair.equals(params.tradingPair)) {
      throw new InvalidOperationException(
        'Position.open',
        'Take profit price must match trading pair',
      );
    }

    // Validate: size is in base asset
    if (!params.intendedSize.asset.equals(params.tradingPair.base)) {
      throw new InvalidOperationException(
        'Position.open',
        `Position size must be in base asset ${params.tradingPair.base.symbol}`,
      );
    }
    // Validate intended size is positive
    if (!params.intendedSize.isValidSize()) {
      throw new InvalidOperationException(
        'Position.open',
        'Position size must be positive',
        params.intendedSize.value,
      );
    }

    // Validate: price levels make sense for direction
    if (params.side === PositionSide.LONG) {
      if (params.intendedStopLoss.greaterThanOrEqual(params.intendedEntry)) {
        throw new InvalidOperationException(
          'Position.open',
          'Long position: stop loss must be below entry price',
        );
      }
      if (params.intendedTakeProfit.lessThanOrEqual(params.intendedEntry)) {
        throw new InvalidOperationException(
          'Position.open',
          'Long position: take profit must be above entry price',
        );
      }
    } else {
      if (params.intendedStopLoss.lessThanOrEqual(params.intendedEntry)) {
        throw new InvalidOperationException(
          'Position.open',
          'Short position: stop loss must be above entry price',
        );
      }
      if (params.intendedTakeProfit.greaterThanOrEqual(params.intendedEntry)) {
        throw new InvalidOperationException(
          'Position.open',
          'Short position: take profit must be below entry price',
        );
      }
    }

    return new Position({
      ...params,
      status: PositionStatus.OPENING,
      createdAt: new Date(),
    });
  }

  // ============================================
  // State Transitions (What happened on exchange)
  // ============================================

  /**
   * Entry order filled - position is now open
   */
  markAsOpened(params: {
    actualEntryPrice: Price;
    actualSize: Amount;
    entryOrderId: string;
    stopLossOrderId: string;
    takeProfitOrderId: string;
    openedAt?: Date;
  }): void {
    this.assertStatus(PositionStatus.OPENING, 'mark as opened');

    // Validate prices match pair
    if (!params.actualEntryPrice.pair.equals(this.props.tradingPair)) {
      throw new InvalidOperationException(
        'Position.markAsOpened',
        'Actual entry price must match trading pair',
      );
    }

    // Validate size is in base asset
    if (!params.actualSize.asset.equals(this.props.tradingPair.base)) {
      throw new InvalidOperationException(
        'Position.markAsOpened',
        'Actual size must be in base asset',
      );
    }

    this.props.actualEntryPrice = params.actualEntryPrice;
    this.props.actualSize = params.actualSize;
    this.props.entryOrderId = params.entryOrderId;
    this.props.stopLossOrderId = params.stopLossOrderId;
    this.props.takeProfitOrderId = params.takeProfitOrderId;
    this.props.status = PositionStatus.OPEN;
    this.props.openedAt = params.openedAt || new Date();
  }

  /**
   * Close order placed - waiting for fill
   */
  markAsClosing(exitOrderId: string): void {
    this.assertStatus(PositionStatus.OPEN, 'mark as closing');
    this.props.exitOrderId = exitOrderId;
    this.props.status = PositionStatus.CLOSING;
  }

  /**
   * Position fully closed - calculate P&L
   */
  markAsClosed(params: {
    actualExitPrice: Price;
    actualSize: Amount;
    fees: Amount;
    exitReason: PositionExitReason;
    closedAt?: Date;
  }): void {
    if (
      this.props.status !== PositionStatus.CLOSING &&
      this.props.status !== PositionStatus.OPEN
    ) {
      throw new InvalidOperationException(
        'Position.markAsClosed',
        `Cannot close position in ${this.props.status} status`,
      );
    }

    // Must have been opened first
    if (!this.props.actualEntryPrice || !this.props.actualSize) {
      throw new InvalidOperationException(
        'Position.markAsClosed',
        'Cannot close position that was never opened',
      );
    }

    // Validate exit price matches pair
    if (!params.actualExitPrice.pair.equals(this.props.tradingPair)) {
      throw new InvalidOperationException(
        'Position.markAsClosed',
        'Exit price must match trading pair',
      );
    }

    // Validate size matches
    if (!params.actualSize.equals(this.props.actualSize)) {
      throw new InvalidOperationException(
        'Position.markAsClosed',
        'Exit size must match position size',
      );
    }

    // Validate fees are in quote asset
    if (!params.fees.asset.equals(this.props.tradingPair.quote)) {
      throw new InvalidOperationException(
        'Position.markAsClosed',
        'Fees must be in quote asset',
      );
    }

    // Calculate realized P&L
    const pnl = this.calculateRealizedPnL(
      this.props.actualEntryPrice,
      params.actualExitPrice,
      this.props.actualSize,
    );

    this.props.actualExitPrice = params.actualExitPrice;
    this.props.fees = params.fees;
    this.props.exitReason = params.exitReason;
    this.props.realizedPnL = pnl.subtract(params.fees);
    this.props.status = PositionStatus.CLOSED;
    this.props.closedAt = params.closedAt || new Date();
  }

  // ============================================
  // Modifications (Agent adjusts SL/TP)
  // ============================================

  updateStopLoss(newStopLoss: Price, newOrderId: string): void {
    this.assertStatus(PositionStatus.OPEN, 'update stop loss');

    if (!newStopLoss.pair.equals(this.props.tradingPair)) {
      throw new InvalidOperationException(
        'Position.updateStopLoss',
        'Stop loss price must match trading pair',
      );
    }

    // Validate new SL makes sense for direction
    if (!this.props.actualEntryPrice) {
      throw new InvalidOperationException(
        'Position.updateStopLoss',
        'Cannot update stop loss before position is opened',
      );
    }

    if (this.props.side === PositionSide.LONG) {
      if (newStopLoss.greaterThanOrEqual(this.props.actualEntryPrice)) {
        throw new InvalidOperationException(
          'Position.updateStopLoss',
          'Long position: new stop loss must be below entry',
        );
      }
    } else {
      if (newStopLoss.lessThanOrEqual(this.props.actualEntryPrice)) {
        throw new InvalidOperationException(
          'Position.updateStopLoss',
          'Short position: new stop loss must be above entry',
        );
      }
    }

    this.props.intendedStopLoss = newStopLoss;
    this.props.stopLossOrderId = newOrderId;
  }

  updateTakeProfit(newTakeProfit: Price, newOrderId: string): void {
    this.assertStatus(PositionStatus.OPEN, 'update take profit');

    if (!newTakeProfit.pair.equals(this.props.tradingPair)) {
      throw new InvalidOperationException(
        'Position.updateTakeProfit',
        'Take profit price must match trading pair',
      );
    }

    if (!this.props.actualEntryPrice) {
      throw new InvalidOperationException(
        'Position.updateTakeProfit',
        'Cannot update take profit before position is opened',
      );
    }

    if (this.props.side === PositionSide.LONG) {
      if (newTakeProfit.lessThanOrEqual(this.props.actualEntryPrice)) {
        throw new InvalidOperationException(
          'Position.updateTakeProfit',
          'Long position: new take profit must be above entry',
        );
      }
    } else {
      if (newTakeProfit.greaterThanOrEqual(this.props.actualEntryPrice)) {
        throw new InvalidOperationException(
          'Position.updateTakeProfit',
          'Short position: new take profit must be below entry',
        );
      }
    }

    this.props.intendedTakeProfit = newTakeProfit;
    this.props.takeProfitOrderId = newOrderId;
  }

  // ============================================
  // Calculations
  // ============================================

  /**
   * Calculate unrealized P&L at current market price
   * (Only valid for open positions)
   */
  calculateUnrealizedPnL(currentPrice: Price): Amount {
    this.assertStatus(PositionStatus.OPEN, 'calculate unrealized P&L');

    if (!this.props.actualEntryPrice || !this.props.actualSize) {
      throw new InvalidOperationException(
        'Position.calculateUnrealizedPnL',
        'Position not opened yet',
      );
    }

    if (!currentPrice.pair.equals(this.props.tradingPair)) {
      throw new InvalidOperationException(
        'Position.calculateUnrealizedPnL',
        'Current price must match trading pair',
      );
    }

    return this.calculateRealizedPnL(
      this.props.actualEntryPrice,
      currentPrice,
      this.props.actualSize,
    );
  }

  /**
   * Calculate P&L between two prices
   *
   * Logic:
   * - LONG: profit when exit > entry (exit - entry is positive)
   * - SHORT: profit when exit < entry (entry - exit is positive)
   */
  private calculateRealizedPnL(
    entry: Price,
    exit: Price,
    size: Amount,
  ): Amount {
    // Calculate price difference based on position side
    const priceDiff = this.isLong()
      ? exit.subtract(entry) // LONG: exit - entry (positive = profit)
      : entry.subtract(exit); // SHORT: entry - exit (positive = profit)

    // Multiply by size to get P&L in quote asset
    // priceDiff is already an Amount in quote asset from Price.subtract()
    return Amount.from(
      priceDiff.value * size.value,
      this.props.tradingPair.quote,
    );
  }

  /**
   * Calculate return on investment (%)
   */
  getROI(): number | null {
    if (
      !this.props.realizedPnL ||
      !this.props.actualEntryPrice ||
      !this.props.actualSize
    ) {
      return null;
    }

    // Cost basis = entry price * size
    const costBasis = this.props.actualEntryPrice.convertToQuote(
      this.props.actualSize,
    );

    return (this.props.realizedPnL.value / costBasis.value) * 100;
  }

  /**
   * How long was position open (in milliseconds)
   */
  getDuration(): number | null {
    if (!this.props.openedAt) return null;
    const endTime = this.props.closedAt || new Date();
    return endTime.getTime() - this.props.openedAt.getTime();
  }

  /**
   * Get slippage: difference between intended and actual entry
   * Returns Amount in quote asset
   */
  getEntrySlippage(): Amount | null {
    if (!this.props.actualEntryPrice) return null;
    return this.props.actualEntryPrice.subtract(this.props.intendedEntry);
  }

  /**
   * Get slippage: difference between intended and actual exit
   * Returns Amount in quote asset
   */
  getExitSlippage(): Amount | null {
    if (!this.props.actualExitPrice) return null;

    // Intended exit depends on why it closed
    const intendedExit =
      this.props.exitReason === PositionExitReason.STOP_LOSS
        ? this.props.intendedStopLoss
        : this.props.exitReason === PositionExitReason.TAKE_PROFIT
          ? this.props.intendedTakeProfit
          : null;

    if (!intendedExit) return null;

    return this.props.actualExitPrice.subtract(intendedExit);
  }

  // ============================================
  // Queries
  // ============================================

  get id(): string {
    return this.props.id;
  }

  get tradingPair(): TradingPair {
    return this.props.tradingPair;
  }

  get side(): PositionSide {
    return this.props.side;
  }

  get status(): PositionStatus {
    return this.props.status;
  }

  get intendedEntry(): Price {
    return this.props.intendedEntry;
  }

  get intendedStopLoss(): Price {
    return this.props.intendedStopLoss;
  }

  get intendedTakeProfit(): Price {
    return this.props.intendedTakeProfit;
  }

  get intendedSize(): Amount {
    return this.props.intendedSize;
  }

  get actualEntryPrice(): Price | undefined {
    return this.props.actualEntryPrice;
  }

  get actualExitPrice(): Price | undefined {
    return this.props.actualExitPrice;
  }

  get actualSize(): Amount | undefined {
    return this.props.actualSize;
  }

  get realizedPnL(): Amount | undefined {
    return this.props.realizedPnL;
  }

  get fees(): Amount | undefined {
    return this.props.fees;
  }

  get exitReason(): PositionExitReason | undefined {
    return this.props.exitReason;
  }

  get entryOrderId(): string | undefined {
    return this.props.entryOrderId;
  }

  get stopLossOrderId(): string | undefined {
    return this.props.stopLossOrderId;
  }

  get takeProfitOrderId(): string | undefined {
    return this.props.takeProfitOrderId;
  }

  get exitOrderId(): string | undefined {
    return this.props.exitOrderId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get openedAt(): Date | undefined {
    return this.props.openedAt;
  }

  get closedAt(): Date | undefined {
    return this.props.closedAt;
  }

  get agentId(): string | undefined {
    return this.props.agentId;
  }

  get strategyId(): string | undefined {
    return this.props.strategyId;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  isOpen(): boolean {
    return this.props.status === PositionStatus.OPEN;
  }

  isClosed(): boolean {
    return this.props.status === PositionStatus.CLOSED;
  }

  isLong(): boolean {
    return this.props.side === PositionSide.LONG;
  }

  isShort(): boolean {
    return this.props.side === PositionSide.SHORT;
  }

  isProfitable(): boolean {
    return this.props.realizedPnL?.isPositive() ?? false;
  }

  // ============================================
  // Guards
  // ============================================

  private assertStatus(expected: PositionStatus, operation: string): void {
    if (this.props.status !== expected) {
      throw new InvalidOperationException(
        `Position.${operation}`,
        `Cannot ${operation} position in ${this.props.status} status (expected ${expected})`,
      );
    }
  }

  // ============================================
  // Persistence
  // ============================================

  toJSON() {
    return {
      id: this.props.id,
      tradingPair: this.props.tradingPair.toSymbol(),
      side: this.props.side,

      intended: {
        entry: this.props.intendedEntry.value,
        stopLoss: this.props.intendedStopLoss.value,
        takeProfit: this.props.intendedTakeProfit.value,
        size: this.props.intendedSize.value,
      },

      actual: this.props.actualEntryPrice
        ? {
            entryPrice: this.props.actualEntryPrice.value,
            exitPrice: this.props.actualExitPrice?.value,
            size: this.props.actualSize?.value,
          }
        : null,

      orders: {
        entry: this.props.entryOrderId,
        stopLoss: this.props.stopLossOrderId,
        takeProfit: this.props.takeProfitOrderId,
        exit: this.props.exitOrderId,
      },

      status: this.props.status,
      exitReason: this.props.exitReason,

      pnl: this.props.realizedPnL
        ? {
            realized: this.props.realizedPnL.value,
            fees: this.props.fees?.value,
            roi: this.getROI(),
          }
        : null,

      slippage: {
        entry: this.getEntrySlippage()?.value,
        exit: this.getExitSlippage()?.value,
      },

      timestamps: {
        created: this.props.createdAt.toISOString(),
        opened: this.props.openedAt?.toISOString(),
        closed: this.props.closedAt?.toISOString(),
        duration: this.getDuration(),
      },

      metadata: {
        agentId: this.props.agentId,
        strategyId: this.props.strategyId,
        notes: this.props.notes,
      },
    };
  }
}
