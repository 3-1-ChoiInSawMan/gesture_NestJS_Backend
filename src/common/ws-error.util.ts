import { ErrorCode } from "./error-code";
import { Socket } from 'socket.io';

export type ErrorCodeKey = keyof typeof ErrorCode;

export function emitWsError(
  client: Socket,
  statusCode: ErrorCodeKey
) {
  client.emit('ws_error', {
    statusCode,
    message: ErrorCode[statusCode]
  });
}

export function disconnectWithAuthError(
  client: Socket,
  statusCode: ErrorCodeKey
) {
  emitWsError(client, statusCode);

  client.disconnect(true);
}
