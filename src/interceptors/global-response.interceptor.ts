import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, Observable } from "rxjs";
import { SKIP_RESPONSE_INTERCEPTOR } from "src/decorators/skip-response-interceptor.decorator";

@Injectable()
export class GlobalResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {};

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_INTERCEPTOR,
      [
        context.getHandler(),
        context.getClass()
      ]
    );

    if (skip) {
      return next.handle();
    }

    return next.handle().pipe(
      map(({ data, message }) => {
        return {
          success: true,
          statusCode: 'SC_000',
          data,
          message
        };
      })
    )
  }
}
