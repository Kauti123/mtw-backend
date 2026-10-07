import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  health() {
    return { service: 'user-service', status: 'ok' };
  }
}
