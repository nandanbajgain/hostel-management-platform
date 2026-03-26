import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { getAllowedOrigins } from '../../common/utils/allowed-origins';

type SocketPayload = {
  sub: string;
  role: string;
};

@WebSocketGateway({
  cors: { origin: getAllowedOrigins(), credentials: true },
  namespace: '/',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('NotificationsGateway');
  private readonly connectedUsers = new Map<string, string>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<SocketPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      this.connectedUsers.set(payload.sub, client.id);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      client.join(`role:${payload.role}`);
      this.logger.log(`User connected: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    if (userId) {
      this.connectedUsers.delete(userId);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { ok: true });
  }

  notifyUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  notifyRole(role: string, event: string, data: unknown) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }
}
