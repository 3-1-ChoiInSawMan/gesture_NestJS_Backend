import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { AxiosError } from "axios";
import { type Response } from "express";
import { ErrorCode } from "src/common/error-code";

interface ErrorResponse {
  success: boolean;
  code: string;
  message: string;
}

@Catch(AxiosError)
export class AxiosExceptionFilter implements ExceptionFilter {
  catch(error: AxiosError<ErrorResponse>, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const data = error.response?.data;
    const code = data?.code ?? 'COMMON_500';
    const status = error.response?.status ?? 500;

    response.status(status).json({
      success: false,
      statusCode: code,
      data: null,
      message: data?.message ?? ErrorCode[status],
    });
  }
}