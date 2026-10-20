import { ArgumentsHost, Catch, ExceptionFilter, Logger } from "@nestjs/common";
import { AxiosError } from "axios";
import { type Response } from "express";
import { ErrorCode } from "src/common/error-code";

interface ErrorResponse {
  success: boolean;
  statusCode?: string;
  code?: string;
  message?: string;
}

@Catch(AxiosError)
export class AxiosExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AxiosExceptionFilter.name);

  catch(error: AxiosError<ErrorResponse>, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const data = error.response?.data;
    const code = data?.statusCode ?? data?.code ?? 'COMMON_500';
    const status = error.response?.status ?? 500;

    const details = {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status,
      errorCode: code,
      axiosCode: error.code,
      message: data?.message ?? error.message,
    };
    // Core가 4xx로 정상 거절한 요청은 warn, 응답 없음/5xx는 error
    if (error.response && status < 500) this.logger.warn(details, 'Core request rejected');
    else this.logger.error(details, 'Core request failed');

    response.status(status).json({
      success: false,
      statusCode: code,
      data: null,
      message: data?.message ?? ErrorCode[code] ?? ErrorCode.COMMON_500,
    });
  }
}
