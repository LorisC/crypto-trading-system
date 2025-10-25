/**
 * Base exception for all domain rule violations
 *
 * Domain exceptions represent violations of business rules,
 * not programming errors. They should be:
 * - Meaningful to domain experts
 * - Recoverable at application layer
 * - Translated to user-friendly messages at API boundary
 */
export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}
