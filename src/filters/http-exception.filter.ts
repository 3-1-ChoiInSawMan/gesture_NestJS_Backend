import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message = status === HttpStatus.BAD_REQUEST && typeof exceptionResponse === 'object'
      ? (exceptionResponse as any).message
      : exception.message;

    response.status(status).json({
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      data: null,
      message,
    });
  }
}
