import { OrderId } from '@domain/value-objects/order-id.vo';
import { OrderParameters } from '@domain/value-objects/order-parameters.vo';
import { Fill } from '@domain/value-objects/fill.vo';
import { Timestamp } from '@domain/value-objects/timestamp.vo';
import { Amount } from '@domain/value-objects/amount.vo';
import { OrderStatus } from '@domain/enum/order-status.enum';
import {
  InvalidStateTransitionException,
  OrderValidationException,
} from '@domain/exceptions';
import { ExchangeOrderId } from '@domain/value-objects';

export interface OrderProps {
  id: OrderId;
  parameters: OrderParameters;
  status: OrderStatus;
  exchangeOrderId?: ExchangeOrderId;
  fills: Fill[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedAt?: Timestamp;
  completedAt?: Timestamp;
  rejectionReason?: string;
}

/**
 * Order Entity
 *
 * Manages order lifecycle and state transitions.
 * Tracks what was requested vs what was executed.
 *
 * State machine:
 * PENDING → SUBMITTED → OPEN → [PARTIALLY_FILLED] → FILLED
 *        ↘ REJECTED
 *        ↘ CANCELLED
 *        ↘ FAILED
 */
export class Order {
  private constructor(private props: OrderProps) {}

  static create(parameters: OrderParameters): Order {
    const now = Timestamp.now();
    return new Order({
      id: OrderId.generate(),
      parameters,
      status: OrderStatus.PENDING,
      fills: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: OrderProps): Order {
    return new Order(props);
  }

  // Getters
  get id(): OrderId {
    return this.props.id;
  }

  get parameters(): OrderParameters {
    return this.props.parameters;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get exchangeOrderId(): ExchangeOrderId | undefined {
    return this.props.exchangeOrderId;
  }

  get fills(): Fill[] {
    return [...this.props.fills]; // Defensive copy
  }

  get createdAt(): Timestamp {
    return this.props.createdAt;
  }

  get updatedAt(): Timestamp {
    return this.props.updatedAt;
  }

  get submittedAt(): Timestamp | undefined {
    return this.props.submittedAt;
  }

  get completedAt(): Timestamp | undefined {
    return this.props.completedAt;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  /**
   * Mark order as submitted to exchange
   */
  markSubmitted(exchangeOrderId: ExchangeOrderId): void {
    if (this.props.status !== OrderStatus.PENDING) {
      throw new InvalidStateTransitionException(
        'Order',
        this.props.status,
        'markSubmitted - only pending orders can be submitted',
      );
    }

    this.props.exchangeOrderId = exchangeOrderId;
    this.props.status = OrderStatus.SUBMITTED;
    this.props.submittedAt = Timestamp.now();
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Mark order as open on exchange (for stop/take profit orders)
   */
  markOpen(): void {
    if (this.props.status !== OrderStatus.SUBMITTED) {
      throw new InvalidStateTransitionException(
        'Order',
        this.props.status,
        'markOpen - only submitted orders can be marked open',
      );
    }

    this.props.status = OrderStatus.OPEN;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Add a fill to the order
   */
  addFill(fill: Fill): void {
    // Validate fill belongs to this order
    if (
      this.props.exchangeOrderId &&
      !fill.matchesOrder(this.props.exchangeOrderId)
    ) {
      throw new OrderValidationException(
        `Fill exchange order ID ${fill.exchangeOrderId.value} does not match order ${this.props.exchangeOrderId.value}`,
      );
    }

    // Market orders go directly to filled
    if (this.props.parameters.isMarketOrder()) {
      if (
        this.props.status !== OrderStatus.SUBMITTED &&
        this.props.status !== OrderStatus.PENDING
      ) {
        throw new InvalidStateTransitionException(
          'Order',
          this.props.status,
          'addFill - market order must be pending or submitted',
        );
      }
    } else {
      // Stop/take profit orders must be open first
      if (
        this.props.status !== OrderStatus.OPEN &&
        this.props.status !== OrderStatus.PARTIALLY_FILLED
      ) {
        throw new InvalidStateTransitionException(
          'Order',
          this.props.status,
          'addFill - limit/stop order must be open or partially filled',
        );
      }
    }

    this.props.fills.push(fill);

    // Calculate total filled quantity
    const totalFilled = this.getTotalFilledQuantity();
    const orderQuantity = this.props.parameters.quantity;

    // Check if fully filled
    if (totalFilled.value >= orderQuantity.value) {
      this.props.status = OrderStatus.FILLED;
      this.props.completedAt = Timestamp.now();
    } else {
      this.props.status = OrderStatus.PARTIALLY_FILLED;
    }

    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Mark order as cancelled
   */
  markCancelled(): void {
    if (
      this.props.status === OrderStatus.FILLED ||
      this.props.status === OrderStatus.REJECTED ||
      this.props.status === OrderStatus.CANCELLED
    ) {
      throw new InvalidStateTransitionException(
        'Order',
        this.props.status,
        'markCancelled - cannot cancel terminal order',
      );
    }

    this.props.status = OrderStatus.CANCELLED;
    this.props.completedAt = Timestamp.now();
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Mark order as rejected by exchange
   */
  markRejected(reason: string): void {
    if (
      this.props.status !== OrderStatus.PENDING &&
      this.props.status !== OrderStatus.SUBMITTED
    ) {
      throw new InvalidStateTransitionException(
        'Order',
        this.props.status,
        'markRejected - only pending/submitted orders can be rejected',
      );
    }

    this.props.status = OrderStatus.REJECTED;
    this.props.rejectionReason = reason;
    this.props.completedAt = Timestamp.now();
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Mark order as failed (system error)
   */
  markFailed(reason: string): void {
    if (this.props.status === OrderStatus.FILLED) {
      throw new InvalidStateTransitionException(
        'Order',
        this.props.status,
        'markFailed - cannot mark filled order as failed',
      );
    }

    this.props.status = OrderStatus.FAILED;
    this.props.rejectionReason = reason;
    this.props.completedAt = Timestamp.now();
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Get total filled quantity across all fills
   */
  getTotalFilledQuantity(): Amount {
    if (this.props.fills.length === 0) {
      return Amount.from(0, this.props.parameters.quantity.asset);
    }

    const total = this.props.fills.reduce(
      (sum, fill) => sum + fill.executedQuantity.value,
      0,
    );

    return Amount.from(total, this.props.parameters.quantity.asset);
  }

  /**
   * Get average fill price weighted by quantity
   */
  getAverageFillPrice(): number | undefined {
    if (this.props.fills.length === 0) {
      return undefined;
    }

    let totalValue = 0;
    let totalQuantity = 0;

    for (const fill of this.props.fills) {
      totalValue += fill.executedQuantity.value * fill.executionPrice.value;
      totalQuantity += fill.executedQuantity.value;
    }

    return totalQuantity > 0 ? totalValue / totalQuantity : undefined;
  }

  /**
   * Get total fees paid across all fills
   */
  getTotalFees(): Amount {
    if (this.props.fills.length === 0) {
      return Amount.from(0, this.props.parameters.pair.quote);
    }

    // Assumes all fees are in quote asset
    const total = this.props.fills.reduce(
      (sum, fill) => sum + fill.fee.value,
      0,
    );

    return Amount.from(total, this.props.parameters.pair.quote);
  }

  /**
   * Check if order is terminal (no further state changes expected)
   */
  isTerminal(): boolean {
    return (
      this.props.status === OrderStatus.FILLED ||
      this.props.status === OrderStatus.CANCELLED ||
      this.props.status === OrderStatus.REJECTED ||
      this.props.status === OrderStatus.FAILED
    );
  }

  /**
   * Check if order is active (can still be filled or cancelled)
   */
  isActive(): boolean {
    return (
      this.props.status === OrderStatus.PENDING ||
      this.props.status === OrderStatus.SUBMITTED ||
      this.props.status === OrderStatus.OPEN ||
      this.props.status === OrderStatus.PARTIALLY_FILLED
    );
  }

  /**
   * Get remaining quantity to be filled
   */
  getRemainingQuantity(): Amount {
    const filled = this.getTotalFilledQuantity();
    const remaining = this.props.parameters.quantity.value - filled.value;
    return Amount.from(
      Math.max(0, remaining),
      this.props.parameters.quantity.asset,
    );
  }

  toJSON() {
    return {
      id: this.props.id.toJSON(),
      parameters: this.props.parameters.toJSON(),
      status: this.props.status,
      exchangeOrderId: this.props.exchangeOrderId?.toJSON(),
      fills: this.props.fills.map((f) => f.toJSON()),
      totalFilledQuantity: this.getTotalFilledQuantity().toJSON(),
      averageFillPrice: this.getAverageFillPrice(),
      totalFees: this.getTotalFees().toJSON(),
      remainingQuantity: this.getRemainingQuantity().toJSON(),
      createdAt: this.props.createdAt.toJSON(),
      updatedAt: this.props.updatedAt.toJSON(),
      submittedAt: this.props.submittedAt?.toJSON(),
      completedAt: this.props.completedAt?.toJSON(),
      rejectionReason: this.props.rejectionReason,
    };
  }
}
