import { DomainException } from './domain.exception';
import { Amount } from '@domain/value-objects/amount.vo';

/**
 * Thrown when attempting operation without sufficient balance
 */
export class InsufficientFundsException extends DomainException {
  constructor(
    public readonly required: Amount,
    public readonly available: Amount,
  ) {
    super(
      `Insufficient ${available.asset.symbol}: required ${required.format()}, available ${available.format()}`,
    );
  }
}
