import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CorporateGeographyService } from './corporate-geography.service';
import {
  CorporateGeographyQuerySchema,
  CreateCorporateGeographySchema,
  UpdateCorporateGeographySchema,
  type CorporateGeographyListResponse,
  type CorporateGeographyRecord,
} from './corporate-geography.dto';

@ApiTags('corporate-geography')
@Controller('corporate-geography')
export class CorporateGeographyController {
  constructor(private readonly service: CorporateGeographyService) {}

  @Get('health')
  @ApiOperation({ summary: 'Corporate geography health probe' })
  health() {
    return this.service.health();
  }

  @Get()
  @ApiOperation({ summary: 'List geography mappings for a corporate' })
  @ApiQuery({ name: 'corporateId', required: true, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Paginated corporate geography list' })
  list(@Query() query: unknown): Promise<CorporateGeographyListResponse> {
    return this.service.list(CorporateGeographyQuerySchema.parse(query ?? {}));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Map a master country (optional state/city) to a corporate',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['corporateId', 'countryId'],
      properties: {
        corporateId: { type: 'string' },
        countryId: { type: 'string' },
        stateId: { type: 'string', nullable: true },
        cityId: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Geography mapping created' })
  @ApiConflictResponse({ description: 'Country already mapped' })
  create(@Body() body: unknown): Promise<CorporateGeographyRecord> {
    return this.service.create(CreateCorporateGeographySchema.parse(body));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get corporate geography mapping by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Geography mapping' })
  @ApiNotFoundResponse({ description: 'Not found' })
  getById(@Param('id') id: string): Promise<CorporateGeographyRecord> {
    return this.service.getById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update corporate geography mapping' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Updated geography mapping' })
  @ApiNotFoundResponse({ description: 'Not found' })
  update(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<CorporateGeographyRecord> {
    return this.service.update(id, UpdateCorporateGeographySchema.parse(body));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove corporate geography mapping' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Deleted' })
  @ApiNotFoundResponse({ description: 'Not found' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
