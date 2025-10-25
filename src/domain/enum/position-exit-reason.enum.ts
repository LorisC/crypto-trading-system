export enum PositionExitReason {
  STOP_LOSS = 'STOP_LOSS',
  TAKE_PROFIT = 'TAKE_PROFIT',
  MANUAL_CLOSE = 'MANUAL_CLOSE', // Agent decided to close
  LIQUIDATION = 'LIQUIDATION', // Exchange force-closed
  EXPIRED = 'EXPIRED', // Time-based exit
}
