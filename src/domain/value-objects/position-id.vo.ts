import { v4 as uuidv4 } from 'uuid';
import { InvalidValueObjectException } from '@domain/exceptions';

/**
 * Position ID Value Object
 *
 * Unique identifier for positions.
 */
export class PositionId {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new InvalidValueObjectException(
        'PositionId',
        'Position ID cannot be empty',
        value,
      );
    }
  }

  static generate(): PositionId {
    return new PositionId(uuidv4());
  }

  static from(value: string): PositionId {
    return new PositionId(value);
  }

  equals(other: PositionId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}
