import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { CounsellingService } from './counselling.service';
import { SendMessageDto } from './dto';
import { getAllowedOrigins } from '../../common/utils/allowed-origins';

type SocketPayload = {
  sub: string;
  role: string;
};

@WebSocketGateway({
  cors: { origin: getAllowedOrigins(), credentials: true },
  namespace: '/counselling',
})
export class CounsellingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('CounsellingGateway');
  private readonly connectedUsers = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly counsellingService: CounsellingService,
  ) {}

  emitSessionMessage(sessionId: string, message: {
    id: string;
    sessionId: string;
    senderId: string;
    senderName?: string;
    content: string;
    type: string;
    sentAt: Date;
  }) {
    this.server.to(`session:${sessionId}`).emit('counselling:message', message);
  }

  handleConnection(client: Socket) {
    try {
      const auth = (client.handshake.auth || {}) as { token?: unknown };
      const header = client.handshake.headers?.authorization;
      const authHeader =
        typeof header === 'string'
          ? header
          : Array.isArray(header)
            ? header[0]
            : undefined;

      const tokenFromHeader = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : undefined;
      const token =
        typeof auth.token === 'string' ? auth.token : tokenFromHeader;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<SocketPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      this.connectedUsers.set(payload.sub, client.id);
      (client.data as { userId?: string; role?: string }).userId = payload.sub;
      (client.data as { userId?: string; role?: string }).role = payload.role;

      this.logger.log(`User connected to counselling: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as { userId?: string } | undefined)?.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`User disconnected: ${userId}`);
    }
  }

  @SubscribeMessage('counselling:join-session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    try {
      const userId = (client.data as { userId?: string })?.userId;
      void client.join(`session:${data.sessionId}`);

      const session = await this.counsellingService.getSessionById(data.sessionId);

      // Verify user is part of session
      if (session.studentId !== userId && session.counsellor.userId !== userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Broadcast user joined
      this.server
        .to(`session:${data.sessionId}`)
        .emit('counselling:user-joined', {
          sessionId: data.sessionId,
          userId,
          type: session.studentId === userId ? 'student' : 'counsellor',
        });

      this.logger.log(`User ${userId} joined session ${data.sessionId}`);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('counselling:send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; content: string; type?: string },
  ) {
    try {
      const userId = (client.data as { userId?: string })?.userId;
      if (!userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const dto: SendMessageDto = {
        content: data.content,
        type: data.type as any,
      };

      const message = await this.counsellingService.sendMessage(
        data.sessionId,
        userId,
        dto,
      );

      this.server.to(`session:${data.sessionId}`).emit('counselling:message', {
        id: message.id,
        sessionId: data.sessionId,
        senderId: message.senderId,
        senderName: message.sender.name,
        content: message.content,
        type: message.type,
        sentAt: message.sentAt,
      });

      this.logger.log(`Message sent in session ${data.sessionId}`);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('counselling:typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; isTyping: boolean },
  ) {
    try {
      const userId = (client.data as { userId?: string })?.userId;
      if (!userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const user = await this.counsellingService.getStudentProfile(userId);
      if (!user) {
        client.emit('error', { message: 'User not found' });
        return;
      }

      this.server.to(`session:${data.sessionId}`).emit('counselling:typing', {
        userId,
        userName: user.name,
        isTyping: data.isTyping,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('counselling:read-messages')
  async handleReadMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    try {
      const userId = (client.data as { userId?: string })?.userId;
      if (!userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      await this.counsellingService.markMessagesAsRead(data.sessionId, userId);

      this.server
        .to(`session:${data.sessionId}`)
        .emit('counselling:messages-read', { userId, sessionId: data.sessionId });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('counselling:counsellor-status')
  async handleCounsellorStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { isOnline: boolean },
  ) {
    try {
      const userId = (client.data as { userId?: string })?.userId;
      const role = (client.data as { role?: string })?.role;

      if (!userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      if (role !== 'COUNSELLOR') {
        client.emit('error', { message: 'Only counsellors can set status' });
        return;
      }

      await this.counsellingService.setCounsellorOnlineStatus(userId, data.isOnline);

      // Broadcast to all clients
      this.server.emit('counselling:counsellor-status-updated', {
        userId,
        isOnline: data.isOnline,
      });

      this.logger.log(
        `Counsellor ${userId} status updated: ${data.isOnline ? 'online' : 'offline'}`,
      );
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
