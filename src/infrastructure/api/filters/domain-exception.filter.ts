import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainException,
  InvalidValueObjectException,
  InvalidOperationException,
  InsufficientFundsException,
} from '@domain/exceptions';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Map domain exceptions to HTTP status codes
    const status = this.getHttpStatus(exception);

    // Build user-friendly error response
    response.status(status).json({
      error: {
        type: exception.name,
        message: exception.message,
        details: this.getDetails(exception),
      },
      timestamp: new Date().toISOString(),
    });
  }

  private getHttpStatus(exception: DomainException): HttpStatus {
    if (exception instanceof InvalidValueObjectException) {
      return HttpStatus.BAD_REQUEST; // 400
    }
    if (exception instanceof InvalidOperationException) {
      return HttpStatus.BAD_REQUEST; // 400
    }
    if (exception instanceof InsufficientFundsException) {
      return HttpStatus.UNPROCESSABLE_ENTITY; // 422
    }
    return HttpStatus.BAD_REQUEST; // Default
  }

  private getDetails(exception: DomainException): unknown {
    if (exception instanceof InvalidValueObjectException) {
      return {
        valueObjectType: exception.valueObjectType,
        reason: exception.reason,
        providedValue: exception.providedValue,
      };
    }
    if (exception instanceof InvalidOperationException) {
      return {
        operation: exception.operation,
        reason: exception.reason,
      };
    }
    if (exception instanceof InsufficientFundsException) {
      return {
        required: exception.required.toJSON(),
        available: exception.available.toJSON(),
      };
    }
    return undefined;
  }
}
