import { PositionId } from '@domain/value-objects/position-id.vo';
import { OrderId } from '@domain/value-objects/order-id.vo';
import { Amount } from '@domain/value-objects/amount.vo';
import { Price } from '@domain/value-objects/price.vo';
import { Timestamp } from '@domain/value-objects/timestamp.vo';
import { PositionSide } from '@domain/enum/position-side.enum';
import { PositionStatus } from '@domain/enum/position-status.enum';
import {
  InvalidStateTransitionException,
  PositionValidationException,
} from '@domain/exceptions';
import { TradingPair } from '@domain/value-objects';

export interface PositionProps {
  id: PositionId;
  pair: TradingPair;
  side: PositionSide;
  status: PositionStatus;

  // Entry details
  entryOrderId: OrderId;
  entryPrice?: Price; // Undefined until filled
  entryQuantity?: Amount; // Actual filled quantity
  entryFees?: Amount;

  // Exit details
  exitOrderId?: OrderId;
  exitPrice?: Price;
  exitQuantity?: Amount;
  exitFees?: Amount;

  // Risk management
  stopLossOrderId?: OrderId;
  stopLossPrice?: Price;
  takeProfitOrderId?: OrderId;
  takeProfitPrice?: Price;

  // Timestamps
  createdAt: Timestamp;
  openedAt?: Timestamp;
  closedAt?: Timestamp;
  updatedAt: Timestamp;

  // Agent context
  agentId?: string; // Which agent opened this
  strategyId?: string; // Which strategy/signal
  metadata?: Record<string, any>; // Additional context
}

/**
 * Position Entity
 *
 * Represents an agent's trading position (long or short).
 * Tracks lifecycle from opening → open → closing → closed.
 * Links to entry/exit orders and calculates P&L.
 *
 * Aggregate root for position-related orders.
 */
export class Position {
  private constructor(private props: PositionProps) {}

  static create(
    pair: TradingPair,
    side: PositionSide,
    entryOrderId: OrderId,
    stopLossPrice?: Price,
    takeProfitPrice?: Price,
    agentId?: string,
    strategyId?: string,
  ): Position {
    const now = Timestamp.now();
    return new Position({
      id: PositionId.generate(),
      pair,
      side,
      status: PositionStatus.OPENING,
      entryOrderId,
      stopLossPrice,
      takeProfitPrice,
      agentId,
      strategyId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: PositionProps): Position {
    return new Position(props);
  }

  // Getters
  get id(): PositionId {
    return this.props.id;
  }

  get pair(): TradingPair {
    return this.props.pair;
  }

  get side(): PositionSide {
    return this.props.side;
  }

  get status(): PositionStatus {
    return this.props.status;
  }

  get entryOrderId(): OrderId {
    return this.props.entryOrderId;
  }

  get entryPrice(): Price | undefined {
    return this.props.entryPrice;
  }

  get entryQuantity(): Amount | undefined {
    return this.props.entryQuantity;
  }

  get entryFees(): Amount | undefined {
    return this.props.entryFees;
  }

  get exitOrderId(): OrderId | undefined {
    return this.props.exitOrderId;
  }

  get exitPrice(): Price | undefined {
    return this.props.exitPrice;
  }

  get exitQuantity(): Amount | undefined {
    return this.props.exitQuantity;
  }

  get exitFees(): Amount | undefined {
    return this.props.exitFees;
  }

  get stopLossOrderId(): OrderId | undefined {
    return this.props.stopLossOrderId;
  }

  get stopLossPrice(): Price | undefined {
    return this.props.stopLossPrice;
  }

  get takeProfitOrderId(): OrderId | undefined {
    return this.props.takeProfitOrderId;
  }

  get takeProfitPrice(): Price | undefined {
    return this.props.takeProfitPrice;
  }

  get createdAt(): Timestamp {
    return this.props.createdAt;
  }

  get openedAt(): Timestamp | undefined {
    return this.props.openedAt;
  }

  get closedAt(): Timestamp | undefined {
    return this.props.closedAt;
  }

  get updatedAt(): Timestamp {
    return this.props.updatedAt;
  }

  get agentId(): string | undefined {
    return this.props.agentId;
  }

  get strategyId(): string | undefined {
    return this.props.strategyId;
  }

  /**
   * Mark position as opened (entry order filled)
   */
  markOpened(
    entryPrice: Price,
    entryQuantity: Amount,
    entryFees: Amount,
  ): void {
    if (this.props.status !== PositionStatus.OPENING) {
      throw new InvalidStateTransitionException(
        'Position',
        this.props.status,
        'markOpened - only opening positions can be marked opened',
      );
    }

    this.props.entryPrice = entryPrice;
    this.props.entryQuantity = entryQuantity;
    this.props.entryFees = entryFees;
    this.props.status = PositionStatus.OPEN;
    this.props.openedAt = Timestamp.now();
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Attach stop loss order
   */
  attachStopLoss(orderId: OrderId, stopPrice: Price): void {
    if (this.props.status !== PositionStatus.OPEN) {
      throw new PositionValidationException(
        'Cannot attach stop loss to position not in OPEN status',
      );
    }

    this.props.stopLossOrderId = orderId;
    this.props.stopLossPrice = stopPrice;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Attach take profit order
   */
  attachTakeProfit(orderId: OrderId, takeProfitPrice: Price): void {
    if (this.props.status !== PositionStatus.OPEN) {
      throw new PositionValidationException(
        'Cannot attach take profit to position not in OPEN status',
      );
    }

    this.props.takeProfitOrderId = orderId;
    this.props.takeProfitPrice = takeProfitPrice;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Initiate position close
   */
  initiateClose(exitOrderId: OrderId): void {
    if (this.props.status !== PositionStatus.OPEN) {
      throw new InvalidStateTransitionException(
        'Position',
        this.props.status,
        'initiateClose - only open positions can be closed',
      );
    }

    this.props.exitOrderId = exitOrderId;
    this.props.status = PositionStatus.CLOSING;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Mark position as closed (exit order filled)
   */
  markClosed(exitPrice: Price, exitQuantity: Amount, exitFees: Amount): void {
    if (this.props.status !== PositionStatus.CLOSING) {
      throw new InvalidStateTransitionException(
        'Position',
        this.props.status,
        'markClosed - only closing positions can be marked closed',
      );
    }

    this.props.exitPrice = exitPrice;
    this.props.exitQuantity = exitQuantity;
    this.props.exitFees = exitFees;
    this.props.status = PositionStatus.CLOSED;
    this.props.closedAt = Timestamp.now();
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Mark position as liquidated (forced close)
   */
  markLiquidated(
    exitPrice: Price,
    exitQuantity: Amount,
    exitFees: Amount,
  ): void {
    if (
      this.props.status !== PositionStatus.OPEN &&
      this.props.status !== PositionStatus.CLOSING
    ) {
      throw new InvalidStateTransitionException(
        'Position',
        this.props.status,
        'markLiquidated - only open/closing positions can be liquidated',
      );
    }

    this.props.exitPrice = exitPrice;
    this.props.exitQuantity = exitQuantity;
    this.props.exitFees = exitFees;
    this.props.status = PositionStatus.LIQUIDATED;
    this.props.closedAt = Timestamp.now();
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Calculate unrealized P&L (for open positions)
   */
  calculateUnrealizedPnL(currentPrice: Price): Amount | undefined {
    if (!this.props.entryPrice || !this.props.entryQuantity) {
      return undefined;
    }

    if (this.props.status !== PositionStatus.OPEN) {
      return undefined;
    }

    const quantity = this.props.entryQuantity.value;
    const entryValue = this.props.entryPrice.value * quantity;
    const currentValue = currentPrice.value * quantity;

    let pnl: number;
    if (this.props.side === PositionSide.LONG) {
      pnl = currentValue - entryValue;
    } else {
      pnl = entryValue - currentValue;
    }

    return Amount.from(pnl, this.props.pair.quote);
  }

  /**
   * Calculate realized P&L (for closed positions)
   */
  calculateRealizedPnL(): Amount | undefined {
    if (
      !this.props.entryPrice ||
      !this.props.entryQuantity ||
      !this.props.exitPrice ||
      !this.props.exitQuantity
    ) {
      return undefined;
    }

    if (
      this.props.status !== PositionStatus.CLOSED &&
      this.props.status !== PositionStatus.LIQUIDATED
    ) {
      return undefined;
    }

    const quantity = Math.min(
      this.props.entryQuantity.value,
      this.props.exitQuantity.value,
    );
    const entryValue = this.props.entryPrice.value * quantity;
    const exitValue = this.props.exitPrice.value * quantity;

    let grossPnl: number;
    if (this.props.side === PositionSide.LONG) {
      grossPnl = exitValue - entryValue;
    } else {
      grossPnl = entryValue - exitValue;
    }

    // Subtract fees
    const totalFees =
      (this.props.entryFees?.value || 0) + (this.props.exitFees?.value || 0);
    const netPnl = grossPnl - totalFees;

    return Amount.from(netPnl, this.props.pair.quote);
  }

  /**
   * Calculate return on investment (%)
   */
  calculateROI(): number | undefined {
    const pnl = this.calculateRealizedPnL();
    if (!pnl || !this.props.entryPrice || !this.props.entryQuantity) {
      return undefined;
    }

    const initialValue =
      this.props.entryPrice.value * this.props.entryQuantity.value;
    return (pnl.value / initialValue) * 100;
  }

  /**
   * Get position duration
   */
  getDuration(): number | undefined {
    if (!this.props.openedAt) {
      return undefined;
    }

    const end = this.props.closedAt || Timestamp.now();
    return end.differenceInMilliseconds(this.props.openedAt);
  }

  /**
   * Check if position is open
   */
  isOpen(): boolean {
    return this.props.status === PositionStatus.OPEN;
  }

  /**
   * Check if position is closed
   */
  isClosed(): boolean {
    return (
      this.props.status === PositionStatus.CLOSED ||
      this.props.status === PositionStatus.LIQUIDATED
    );
  }

  /**
   * Update metadata
   */
  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.props.updatedAt = Timestamp.now();
  }

  toJSON() {
    return {
      id: this.props.id.toJSON(),
      pair: this.props.pair.toSymbol(),
      side: this.props.side,
      status: this.props.status,
      entryOrderId: this.props.entryOrderId.toJSON(),
      entryPrice: this.props.entryPrice?.toJSON(),
      entryQuantity: this.props.entryQuantity?.toJSON(),
      entryFees: this.props.entryFees?.toJSON(),
      exitOrderId: this.props.exitOrderId?.toJSON(),
      exitPrice: this.props.exitPrice?.toJSON(),
      exitQuantity: this.props.exitQuantity?.toJSON(),
      exitFees: this.props.exitFees?.toJSON(),
      stopLossOrderId: this.props.stopLossOrderId?.toJSON(),
      stopLossPrice: this.props.stopLossPrice?.toJSON(),
      takeProfitOrderId: this.props.takeProfitOrderId?.toJSON(),
      takeProfitPrice: this.props.takeProfitPrice?.toJSON(),
      createdAt: this.props.createdAt.toJSON(),
      openedAt: this.props.openedAt?.toJSON(),
      closedAt: this.props.closedAt?.toJSON(),
      updatedAt: this.props.updatedAt.toJSON(),
      agentId: this.props.agentId,
      strategyId: this.props.strategyId,
      metadata: this.props.metadata,
    };
  }
}
