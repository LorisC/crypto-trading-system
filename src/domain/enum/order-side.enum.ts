/**
 * Order Side
 *
 * Direction of the order:
 * - BUY: Acquire base asset (agent opening long or closing short)
 * - SELL: Dispose base asset (agent closing long or opening short)
 */
export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}
