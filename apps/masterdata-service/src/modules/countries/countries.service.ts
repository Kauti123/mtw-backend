import { Injectable } from '@nestjs/common';
import { CountriesRepository } from './countries.repository';
import type {
  CountryListResponse,
  CountryQueryDto,
  StateListResponse,
  StateQueryDto,
} from './countries.dto';

@Injectable()
export class CountriesService {
  constructor(private readonly repository: CountriesRepository) {}

  health() {
    return { service: 'countries', status: 'ok' };
  }

  listCountries(query: CountryQueryDto): Promise<CountryListResponse> {
    return this.repository.listCountries(query);
  }

  listStates(query: StateQueryDto): Promise<StateListResponse> {
    return this.repository.listStates(query);
  }
}
