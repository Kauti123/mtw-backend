import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CityQuerySchema, type CityListResponse } from './cities.dto';

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly service: CitiesService) {}

  @Get('health')
  @ApiOperation({ summary: 'Cities module health probe' })
  @ApiOkResponse({ description: 'Module is healthy' })
  health() {
    return this.service.health();
  }

  @Get()
  @ApiOperation({ summary: 'List cities for autocomplete' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'countryCode', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Paginated city list' })
  async list(@Query() query: unknown): Promise<CityListResponse> {
    return this.service.list(CityQuerySchema.parse(query ?? {}));
  }
}
