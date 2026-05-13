import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Socket } from 'socket.io';
import { disconnectWithAuthError } from "src/common/ws-error.util";

@Injectable()
export class WsGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const user = client.data.user;

    if (!user) {
      disconnectWithAuthError(client, 'AUTH_007');

      return false;
    }

    if (user.exp * 1000 < Date.now()) {
      disconnectWithAuthError(client, 'AUTH_002');

      return false;
    }

    return true;
  }
}