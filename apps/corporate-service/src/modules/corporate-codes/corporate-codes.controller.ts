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
  CorporateCodeDeleteResponseOpenApi,
  CorporateCodeListResponseOpenApi,
  CorporateCodeRecordOpenApi,
  CorporateCodeUniqueCheckOpenApi,
  CreateCorporateCodeExample,
  CreateCorporateCodeOpenApi,
  UpdateCorporateCodeExample,
  UpdateCorporateCodeOpenApi,
  UpdateCorporateCodeStatusOpenApi,
} from '@mtw/contracts';
import { CorporateCodesService } from './corporate-codes.service';
import {
  CreateCorporateCodeSchema,
  CorporateCodeQuerySchema,
  UpdateCorporateCodeSchema,
  UpdateCorporateCodeStatusSchema,
  type CorporateCodeListResponse,
  type CorporateCodeRecord,
} from './dto';

@ApiTags('corporate-codes')
@Controller('corporate-codes')
export class CorporateCodesController {
  constructor(private readonly service: CorporateCodesService) {}

  @Get('health')
  @ApiOperation({ summary: 'Corporate codes module health probe' })
  @ApiOkResponse({ description: 'Module is healthy' })
  health() {
    return this.service.health();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a corporate code' })
  @ApiBody({
    schema: CreateCorporateCodeOpenApi,
    examples: {
      default: {
        summary: 'Create Corporate Code form',
        value: CreateCorporateCodeExample,
      },
      uiLabels: {
        summary: 'Create using UI labels',
        value: {
          corporateCode: 'ACME001',
          corporateName: 'Acme Corporation',
          corporateType: 'Client',
          defaultCountry: 'India',
          defaultCurrency: 'INR - Indian Rupee',
          pricingModel: 'Markup',
          gstApplicable: 'Yes',
          status: 'Active',
          primaryContact: 'John Mathew',
          email: 'john.mathew@acmecorp.com',
          phone: '+91 9876543210',
          remarks: 'Primary corporate code for Acme travel bookings.',
        },
      },
    },
  })
  @ApiCreatedResponse({ schema: CorporateCodeRecordOpenApi })
  @ApiConflictResponse({ description: 'Corporate code already exists' })
  async create(@Body() body: unknown): Promise<CorporateCodeRecord> {
    const dto = CreateCorporateCodeSchema.parse(body);
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List corporate codes' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE'] })
  @ApiQuery({
    name: 'corporateType',
    required: false,
    enum: ['CLIENT', 'PARTNER', 'VENDOR', 'INTERNAL', 'AFFILIATE'],
  })
  @ApiQuery({
    name: 'pricingModel',
    required: false,
    enum: ['MARKUP', 'MARKDOWN', 'NET', 'COMMISSION', 'FLAT_FEE'],
  })
  @ApiQuery({ name: 'defaultCountry', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: CorporateCodeListResponseOpenApi })
  async list(@Query() query: unknown): Promise<CorporateCodeListResponse> {
    const parsed = CorporateCodeQuerySchema.parse(query ?? {});
    return this.service.list(parsed);
  }

  @Get('check-code/:code')
  @ApiOperation({ summary: 'Check if a corporate code is available' })
  @ApiParam({ name: 'code', description: 'Corporate code (e.g. ACME001)' })
  @ApiOkResponse({ schema: CorporateCodeUniqueCheckOpenApi })
  async checkCode(@Param('code') code: string): Promise<{ code: string; available: boolean }> {
    return this.service.checkCodeAvailability(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get corporate code by ID or code' })
  @ApiParam({ name: 'id', description: 'Corporate code ID or code value' })
  @ApiOkResponse({ schema: CorporateCodeRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Corporate code not found' })
  async get(@Param('id') id: string): Promise<CorporateCodeRecord> {
    return this.service.getById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update corporate code status' })
  @ApiParam({ name: 'id', description: 'Corporate code ID' })
  @ApiBody({ schema: UpdateCorporateCodeStatusOpenApi })
  @ApiOkResponse({ schema: CorporateCodeRecordOpenApi })
  async updateStatus(@Param('id') id: string, @Body() body: unknown): Promise<CorporateCodeRecord> {
    const dto = UpdateCorporateCodeStatusSchema.parse(body);
    return this.service.updateStatus(id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Full update of a corporate code' })
  @ApiParam({ name: 'id', description: 'Corporate code ID' })
  @ApiBody({
    schema: UpdateCorporateCodeOpenApi,
    examples: {
      default: { summary: 'Update corporate code', value: UpdateCorporateCodeExample },
    },
  })
  @ApiOkResponse({ schema: CorporateCodeRecordOpenApi })
  async update(@Param('id') id: string, @Body() body: unknown): Promise<CorporateCodeRecord> {
    const dto = UpdateCorporateCodeSchema.parse(body);
    return this.service.update(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update of a corporate code' })
  @ApiParam({ name: 'id', description: 'Corporate code ID' })
  @ApiBody({
    schema: UpdateCorporateCodeOpenApi,
    examples: {
      default: { summary: 'Patch corporate code', value: UpdateCorporateCodeExample },
    },
  })
  @ApiOkResponse({ schema: CorporateCodeRecordOpenApi })
  async patch(@Param('id') id: string, @Body() body: unknown): Promise<CorporateCodeRecord> {
    const dto = UpdateCorporateCodeSchema.parse(body);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a corporate code' })
  @ApiParam({ name: 'id', description: 'Corporate code ID' })
  @ApiOkResponse({ schema: CorporateCodeDeleteResponseOpenApi })
  @ApiNotFoundResponse({ description: 'Corporate code not found' })
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    return this.service.delete(id);
  }
}
