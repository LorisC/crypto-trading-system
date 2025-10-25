/**
 * Categories of tradable assets
 */
export enum AssetType {
  /**
   * Volatile cryptocurrencies: BTC, ETH, SOL, etc.
   * Characteristics:
   * - High volatility
   * - Speculative value
   * - Used for trading/investing
   */
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',

  /**
   * Pegged to fiat: USDT, USDC, BUSD, DAI
   * Characteristics:
   * - Low volatility (~$1)
   * - Used as "cash" in crypto
   * - Quote currency for most pairs
   */
  STABLECOIN = 'STABLECOIN',

  /**
   * Traditional fiat: USD, EUR, etc.
   * Characteristics:
   * - Only for accounting/reporting
   * - Rarely traded directly on crypto exchanges
   * - Used for tax calculations
   */
  FIAT = 'FIAT',

  /**
   * Unknown asset type
   */
  UNKNOWN = 'UNKNOWN',
}
