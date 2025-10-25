/**
 * Order Type
 *
 * - MARKET: Execute immediately at best available price (agent entry/exit)
 * - STOP_LOSS: Trigger market order when price reaches stop (agent risk management)
 * - TAKE_PROFIT: Trigger market order when profit target reached (agent profit taking)
 */
export enum OrderType {
  MARKET = 'MARKET',
  STOP_LOSS = 'STOP_LOSS',
  TAKE_PROFIT = 'TAKE_PROFIT',
}
