/**
 * Order Status
 *
 * Order lifecycle for audit trail:
 * - PENDING: Created, not yet sent to exchange
 * - SUBMITTED: Sent to exchange, awaiting confirmation
 * - OPEN: Active on exchange (for stop/take profit orders)
 * - PARTIALLY_FILLED: Some quantity executed (for audit)
 * - FILLED: Completely executed
 * - CANCELLED: Cancelled by agent or system
 * - REJECTED: Rejected by exchange (validation, balance, etc.)
 * - FAILED: System error during submission
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  OPEN = 'OPEN',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
}
