import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException, HttpException)
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: WsException | HttpException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const data = host.switchToWs().getData();

    const error =
      exception instanceof WsException
        ? exception.getError()
        : exception.getResponse();

    const errorMessage =
      typeof error === 'string' ? error : (error as any).message || 'WebSocket error';

    this.logger.warn(`WS Error [${client.id}]: ${errorMessage}`);

    client.emit('error', {
      event: data?.event || 'unknown',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
