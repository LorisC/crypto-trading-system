import { DomainException } from './domain.exception';

/**
 * Thrown when operation violates domain rules
 *
 * Examples:
 * - Adding amounts with different assets
 * - Subtracting to negative
 * - Comparing prices from different pairs
 */
export class InvalidOperationException extends DomainException {
  constructor(
    public readonly operation: string,
    public readonly reason: string,
    public readonly providedValue?: unknown,
  ) {
    super(`Invalid operation '${operation}': ${reason}`);
  }
}
