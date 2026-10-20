import { ArgumentsHost, CallHandler, Catch, ExceptionFilter, ExecutionContext, HttpException, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { map, type Observable } from 'rxjs';

@Injectable()
export class CallWsResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data: unknown) => ({ ok: true, data: data ?? null })));
  }
}

@Catch()
export class CallWsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CallWsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ws = host.switchToWs();
    const client = ws.getClient<Socket>();
    const ack = host.getArgByIndex<unknown>(2);
    const status = exception instanceof HttpException ? exception.getStatus() : 400;
    const message = exception instanceof HttpException || exception instanceof WsException
      ? exception.message : exception instanceof Error ? exception.message : 'Call request failed';
    const response = { ok: false, error: { code: status === 403 ? 'CALL_FORBIDDEN' : 'CALL_REQUEST_FAILED', message } };
    const context = { event: ws.getPattern(), socketId: client.id, userIdx: (client.data as { user?: { idx?: number } }).user?.idx, code: response.error.code };
    // 거절(4xx)은 프레임마다 반복될 수 있어 debug, 예상 못 한 오류만 운영에서 error로 남깁니다.
    if (exception instanceof HttpException || exception instanceof WsException) this.logger.debug({ ...context, message }, 'Call request rejected');
    else this.logger.error({ ...context, err: exception }, 'Call request failed');
    if (typeof ack === 'function') (ack as (response: unknown) => void)(response);
    else client.emit('ws_error', response.error);
  }
}
