import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Nest/Express malformed JSON error
      if (
        status === HttpStatus.BAD_REQUEST &&
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'statusCode' in exceptionResponse &&
        'message' in exceptionResponse &&
        'error' in exceptionResponse &&
        (exceptionResponse as { error?: unknown }).error === 'Bad Request'
      ) {
        return response.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'The request contains invalid JSON.',
          },
        });
      }

      return response.status(status).json(exceptionResponse);
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    });
  }
}
