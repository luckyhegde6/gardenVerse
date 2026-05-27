import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message,
      error:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).error || exception.name,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status}: ${exception.message}`);
    }

    response.status(status).json(errorBody);
  }
}
