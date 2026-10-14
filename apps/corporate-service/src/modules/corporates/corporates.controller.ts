import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import {
  CorporateCodeAvailabilityOpenApi,
  CorporateDeleteResponseOpenApi,
  CorporateListResponseOpenApi,
  CorporateRecordOpenApi,
  CreateCorporateExample,
  CreateCorporateOpenApi,
  UpdateCorporateExample,
  UpdateCorporateOpenApi,
  UpdateCorporateStatusExample,
  UpdateCorporateStatusOpenApi,
} from '@mtw/contracts';
import { CorporateService } from './corporates.service';
import {
  CreateCorporateSchema,
  UpdateCorporateSchema,
  CorporateQuerySchema,
  UpdateCorporateStatusSchema,
  type CorporateRecord,
  type CorporateListResponse,
} from './dto';

@ApiTags('corporates')
@Controller('corporates')
export class CorporateController {
  constructor(private readonly service: CorporateService) {}

  @Get('health')
  @ApiOperation({ summary: 'Corporate service health probe' })
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return this.service.health();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new corporate account' })
  @ApiBody({
    schema: CreateCorporateOpenApi,
    examples: { default: { summary: 'Create corporate', value: CreateCorporateExample } },
  })
  @ApiCreatedResponse({ schema: CorporateRecordOpenApi, description: 'Corporate created successfully' })
  @ApiConflictResponse({ description: 'Corporate code or admin email already exists' })
  async create(@Body() body: unknown): Promise<CorporateRecord> {
    const dto = CreateCorporateSchema.parse(body);
    return this.service.createCorporate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List corporate accounts with pagination and filtering' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  @ApiQuery({ name: 'industry', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: CorporateListResponseOpenApi, description: 'Paginated corporate list' })
  async list(@Query() query: unknown): Promise<CorporateListResponse> {
    const parsedQuery = CorporateQuerySchema.parse(query ?? {});
    return this.service.listCorporates(parsedQuery);
  }

  @Get('check-code/:code')
  @ApiOperation({ summary: 'Check if a corporate code is available' })
  @ApiParam({ name: 'code', description: 'Corporate code' })
  @ApiOkResponse({ schema: CorporateCodeAvailabilityOpenApi })
  async checkCodeAvailability(
    @Param('code') code: string,
  ): Promise<{ code: string; available: boolean }> {
    return this.service.checkCodeAvailability(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get corporate account by ID or code' })
  @ApiParam({ name: 'id', description: 'Corporate ID or code' })
  @ApiOkResponse({ schema: CorporateRecordOpenApi, description: 'Corporate account details' })
  @ApiNotFoundResponse({ description: 'Corporate account not found' })
  async get(@Param('id') id: string): Promise<CorporateRecord> {
    return this.service.getCorporateById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Full update of a corporate account' })
  @ApiParam({ name: 'id', description: 'Corporate ID' })
  @ApiBody({
    schema: UpdateCorporateOpenApi,
    examples: { default: { summary: 'Update corporate', value: UpdateCorporateExample } },
  })
  @ApiOkResponse({ schema: CorporateRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Corporate account not found' })
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<CorporateRecord> {
    const dto = UpdateCorporateSchema.parse(body);
    return this.service.updateCorporate(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update of a corporate account' })
  @ApiParam({ name: 'id', description: 'Corporate ID' })
  @ApiBody({
    schema: UpdateCorporateOpenApi,
    examples: { default: { summary: 'Patch corporate', value: UpdateCorporateExample } },
  })
  @ApiOkResponse({ schema: CorporateRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Corporate account not found' })
  async patch(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<CorporateRecord> {
    const dto = UpdateCorporateSchema.parse(body);
    return this.service.updateCorporate(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update corporate account status' })
  @ApiParam({ name: 'id', description: 'Corporate ID' })
  @ApiBody({
    schema: UpdateCorporateStatusOpenApi,
    examples: { default: { summary: 'Update status', value: UpdateCorporateStatusExample } },
  })
  @ApiOkResponse({ schema: CorporateRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Corporate account not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<CorporateRecord> {
    const dto = UpdateCorporateStatusSchema.parse(body);
    return this.service.updateCorporateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a corporate account' })
  @ApiParam({ name: 'id', description: 'Corporate ID' })
  @ApiOkResponse({ schema: CorporateDeleteResponseOpenApi, description: 'Corporate account deleted' })
  @ApiNotFoundResponse({ description: 'Corporate account not found' })
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    return this.service.deleteCorporate(id);
  }
}
