import { ErrorCode } from "./error-code";
import { Socket } from 'socket.io';

export type ErrorCodeKey = keyof typeof ErrorCode;

export function disconnectWithAuthError(
  client: Socket,
  statusCode: ErrorCodeKey
) {
  client.emit('error', {
    statusCode,
    message: ErrorCode[statusCode]
  });

  client.disconnect(true);
}
