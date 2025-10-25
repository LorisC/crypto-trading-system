import { DomainException } from './domain.exception';

/**
 * Order Validation Exception
 *
 * Thrown when order validation fails.
 * Examples:
 * - Fill doesn't match order ID
 * - Quantity mismatch
 * - Invalid order parameters for current state
 */
export class OrderValidationException extends DomainException {
  constructor(message: string) {
    super(`Order validation failed: ${message}`);
  }
}
