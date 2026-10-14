import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  health() {
    return { service: 'notification-service', status: 'ok' };
  }
}
