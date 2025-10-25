/**
 * Position Status
 *
 * - OPENING: Entry order submitted, waiting for fill
 * - OPEN: Position active, monitoring for exit conditions
 * - CLOSING: Exit order submitted, waiting for fill
 * - CLOSED: Position fully closed
 * - LIQUIDATED: Position forcibly closed (e.g., margin call, stop loss hit)
 */
export enum PositionStatus {
  OPENING = 'OPENING',
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
  LIQUIDATED = 'LIQUIDATED',
}
