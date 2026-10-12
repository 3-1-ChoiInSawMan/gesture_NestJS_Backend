import { ArgumentsHost, CallHandler, Catch, ExceptionFilter, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
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
  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    const ack = host.getArgByIndex<unknown>(2);
    const status = exception instanceof HttpException ? exception.getStatus() : 400;
    const message = exception instanceof HttpException || exception instanceof WsException
      ? exception.message : exception instanceof Error ? exception.message : 'Call request failed';
    const response = { ok: false, error: { code: status === 403 ? 'CALL_FORBIDDEN' : 'CALL_REQUEST_FAILED', message } };
    if (typeof ack === 'function') (ack as (response: unknown) => void)(response);
    else client.emit('ws_error', response.error);
  }
}
