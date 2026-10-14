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
import { MasterDataService } from './masterdata.service';
import {
  CreateCorporateSchema,
  UpdateCorporateSchema,
  CorporateQuerySchema,
  UpdateCorporateStatusSchema,
  type CorporateRecord,
  type CorporateListResponse,
} from './dto';

@ApiTags('masterdata')
@Controller('masterdata')
export class MasterDataController {
  constructor(private readonly service: MasterDataService) {}

  @Get('health')
  @ApiOperation({ summary: 'Master data service health probe' })
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return this.service.health();
  }

  @Post('corporates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new corporate account',
    description:
      'Creates a new B2B corporate account with full configuration including primary admin, access controls, booking settings, billing, security, approval workflows, and spending limits.',
  })
  @ApiBody({
    schema: CreateCorporateOpenApi,
    examples: { default: { summary: 'Create corporate', value: CreateCorporateExample } },
  })
  @ApiCreatedResponse({ schema: CorporateRecordOpenApi, description: 'Corporate account created successfully' })
  @ApiConflictResponse({ description: 'Corporate code or admin email already exists' })
  async createCorporate(@Body() body: unknown): Promise<CorporateRecord> {
    const dto = CreateCorporateSchema.parse(body);
    return this.service.createCorporate(dto);
  }

  @Get('corporates')
  @ApiOperation({ summary: 'List all corporate accounts with pagination and filtering' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by company name, code, or email' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  @ApiQuery({ name: 'industry', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: CorporateListResponseOpenApi, description: 'Paginated corporate list' })
  async listCorporates(@Query() query: unknown): Promise<CorporateListResponse> {
    const parsedQuery = CorporateQuerySchema.parse(query ?? {});
    return this.service.listCorporates(parsedQuery);
  }

  @Get('corporates/check-code/:code')
  @ApiOperation({ summary: 'Check if a corporate code is available' })
  @ApiParam({ name: 'code', description: 'Corporate code (e.g. ACME001)' })
  @ApiOkResponse({ schema: CorporateCodeAvailabilityOpenApi })
  async checkCodeAvailability(
    @Param('code') code: string,
  ): Promise<{ code: string; available: boolean }> {
    return this.service.checkCodeAvailability(code);
  }

  @Get('corporates/:id')
  @ApiOperation({ summary: 'Get corporate account by ID or code' })
  @ApiParam({ name: 'id', description: 'Corporate ID or unique code' })
  @ApiOkResponse({ schema: CorporateRecordOpenApi, description: 'Corporate account details' })
  @ApiNotFoundResponse({ description: 'Corporate account not found' })
  async getCorporateById(@Param('id') id: string): Promise<CorporateRecord> {
    return this.service.getCorporateById(id);
  }

  @Put('corporates/:id')
  @ApiOperation({ summary: 'Full update of a corporate account' })
  @ApiParam({ name: 'id', description: 'Corporate ID' })
  @ApiBody({
    schema: UpdateCorporateOpenApi,
    examples: { default: { summary: 'Update corporate', value: UpdateCorporateExample } },
  })
  @ApiOkResponse({ schema: CorporateRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Corporate account not found' })
  async updateCorporate(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<CorporateRecord> {
    const dto = UpdateCorporateSchema.parse(body);
    return this.service.updateCorporate(id, dto);
  }

  @Patch('corporates/:id')
  @ApiOperation({ summary: 'Partial update of a corporate account' })
  @ApiParam({ name: 'id', description: 'Corporate ID' })
  @ApiBody({
    schema: UpdateCorporateOpenApi,
    examples: { default: { summary: 'Patch corporate', value: UpdateCorporateExample } },
  })
  @ApiOkResponse({ schema: CorporateRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Corporate account not found' })
  async patchCorporate(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<CorporateRecord> {
    const dto = UpdateCorporateSchema.parse(body);
    return this.service.updateCorporate(id, dto);
  }

  @Patch('corporates/:id/status')
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

  @Delete('corporates/:id')
  @ApiOperation({ summary: 'Delete a corporate account' })
  @ApiParam({ name: 'id', description: 'Corporate ID' })
  @ApiOkResponse({ schema: CorporateDeleteResponseOpenApi, description: 'Corporate account deleted' })
  @ApiNotFoundResponse({ description: 'Corporate account not found' })
  async deleteCorporate(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    return this.service.deleteCorporate(id);
  }
}
