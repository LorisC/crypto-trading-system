/**
 * Standard trading timeframes
 *
 * Used for:
 * - Candlestick/kline data
 * - Indicator calculations
 * - Strategy timeframes (e.g., "trade on 15m, confirm on 1h")
 */
export enum Timeframe {
  // Seconds (rarely used in crypto)
  ONE_SECOND = '1s',

  // Minutes
  ONE_MINUTE = '1m',
  THREE_MINUTES = '3m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  THIRTY_MINUTES = '30m',

  // Hours
  ONE_HOUR = '1h',
  TWO_HOURS = '2h',
  FOUR_HOURS = '4h',
  SIX_HOURS = '6h',
  EIGHT_HOURS = '8h',
  TWELVE_HOURS = '12h',

  // Days
  ONE_DAY = '1d',
  THREE_DAYS = '3d',

  // Weeks
  ONE_WEEK = '1w',

  // Months
  ONE_MONTH = '1M',
}
