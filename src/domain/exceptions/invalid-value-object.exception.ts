import { DomainException } from './domain.exception';

/**
 * Thrown when value object creation violates domain rules
 *
 * Examples:
 * - Negative price
 * - Zero quantity
 * - Same base and quote asset
 */
export class InvalidValueObjectException extends DomainException {
  constructor(
    public readonly valueObjectType: string,
    public readonly reason: string,
    public readonly providedValue?: unknown,
  ) {
    super(`Invalid ${valueObjectType}: ${reason}`);
  }
}
