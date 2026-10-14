import { Injectable } from '@nestjs/common';
import { CitiesRepository } from './cities.repository';
import type { CityListResponse, CityQueryDto } from './cities.dto';

@Injectable()
export class CitiesService {
  constructor(private readonly repository: CitiesRepository) {}

  health() {
    return { status: 'ok', module: 'cities' };
  }

  list(query: CityQueryDto): Promise<CityListResponse> {
    return this.repository.list(query);
  }
}
