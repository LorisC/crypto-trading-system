import { DomainException } from './domain.exception';

/**
 * Invalid State Transition Exception
 *
 * Thrown when attempting to transition an entity to an invalid state.
 * Examples:
 * - Marking a filled order as submitted
 * - Closing a position that isn't open
 * - Adding a fill to a cancelled order
 */
export class InvalidStateTransitionException extends DomainException {
  constructor(
    entityType: string,
    currentState: string,
    attemptedTransition: string,
  ) {
    super(
      `Cannot transition ${entityType} from ${currentState} state: ${attemptedTransition}`,
    );
  }
}
