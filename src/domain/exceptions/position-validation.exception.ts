import { DomainException } from './domain.exception';

/**
 * Position Validation Exception
 *
 * Thrown when position validation fails.
 * Examples:
 * - Attaching stop loss to closed position
 * - Missing entry data when calculating P&L
 * - Invalid risk management parameters
 */
export class PositionValidationException extends DomainException {
  constructor(message: string) {
    super(`Position validation failed: ${message}`);
  }
}
