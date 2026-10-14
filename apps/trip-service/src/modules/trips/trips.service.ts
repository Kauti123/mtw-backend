import { Injectable } from '@nestjs/common';

@Injectable()
export class TripService {
  health() {
    return { service: 'trip-service', status: 'ok' };
  }
}
