import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import {
  CountryQuerySchema,
  StateQuerySchema,
  type CountryListResponse,
  type StateListResponse,
} from './countries.dto';

@ApiTags('countries')
@Controller()
export class CountriesController {
  constructor(private readonly service: CountriesService) {}

  @Get('countries/health')
  @ApiOperation({ summary: 'Countries module health probe' })
  @ApiOkResponse({ description: 'Module is healthy' })
  health() {
    return this.service.health();
  }

  @Get('countries')
  @ApiOperation({ summary: 'List master countries for autocomplete' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Paginated country list' })
  listCountries(@Query() query: unknown): Promise<CountryListResponse> {
    return this.service.listCountries(CountryQuerySchema.parse(query ?? {}));
  }

  @Get('states')
  @ApiOperation({ summary: 'List master states for autocomplete' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'countryId', required: false, type: String })
  @ApiQuery({ name: 'countryCode', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Paginated state list' })
  listStates(@Query() query: unknown): Promise<StateListResponse> {
    return this.service.listStates(StateQuerySchema.parse(query ?? {}));
  }
}
