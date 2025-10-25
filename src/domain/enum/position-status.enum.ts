export enum PositionStatus {
  OPENING = 'OPENING', // Entry order placed, not filled yet
  OPEN = 'OPEN', // Entry filled, position active
  CLOSING = 'CLOSING', // Close order placed, not filled yet
  CLOSED = 'CLOSED', // Position fully closed
}
