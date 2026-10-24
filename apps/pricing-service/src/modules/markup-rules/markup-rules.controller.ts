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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateMarkupRuleExample,
  CreateMarkupRuleOpenApi,
  MarkupRuleDeleteResponseOpenApi,
  MarkupRuleListResponseOpenApi,
  MarkupRuleRecordOpenApi,
  UpdateMarkupRuleExample,
  UpdateMarkupRuleOpenApi,
  UpdateMarkupRuleStatusOpenApi,
} from '@mtw/contracts';
import { MarkupRulesService } from './markup-rules.service';
import {
  CreateMarkupRuleSchema,
  MarkupRuleQuerySchema,
  UpdateMarkupRuleSchema,
  UpdateMarkupRuleStatusSchema,
  type MarkupRuleListResponse,
  type MarkupRuleRecord,
} from './dto';

@ApiTags('markup-rules')
@Controller('markup-rules')
export class MarkupRulesController {
  constructor(private readonly service: MarkupRulesService) {}

  @Get('health')
  @ApiOperation({ summary: 'Markup rules module health probe' })
  @ApiOkResponse({ description: 'Module is healthy' })
  health() {
    return this.service.health();
  }

  @Get('product-types')
  @ApiOperation({
    summary: 'List supported product modules',
    description: 'Returns Flight, Hotel, Car, Train, and Bus product types.',
  })
  @ApiOkResponse({ description: 'Supported product types' })
  productTypes() {
    return this.service.productModules();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a markup rule' })
  @ApiBody({
    schema: CreateMarkupRuleOpenApi,
    examples: {
      default: {
        summary: 'Create Markup Rule form',
        value: CreateMarkupRuleExample,
      },
      uiLabels: {
        summary: 'Create using UI labels',
        value: {
          ruleName: 'Domestic Flight Markup',
          productType: 'Flight',
          markupType: 'Percentage',
          markupValue: 5,
          applicableTo: 'All Agents',
          priority: 1,
          validFrom: '01/01/2026',
          validTo: '31/12/2026',
          status: 'Active',
          conditions: [{ field: 'routeType', operator: 'EQ', value: 'DOMESTIC' }],
          remarks: 'Standard domestic flight markup for all agents.',
        },
      },
    },
  })
  @ApiCreatedResponse({ schema: MarkupRuleRecordOpenApi })
  async create(@Body() body: unknown): Promise<MarkupRuleRecord> {
    const dto = CreateMarkupRuleSchema.parse(body);
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List markup rules' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'productType',
    required: false,
    enum: ['FLIGHT', 'HOTEL', 'CAR', 'TRAIN', 'BUS'],
  })
  @ApiQuery({
    name: 'markupType',
    required: false,
    enum: ['PERCENTAGE', 'FIXED'],
  })
  @ApiQuery({
    name: 'applicableTo',
    required: false,
    enum: [
      'ALL_AGENTS',
      'SPECIFIC_AGENTS',
      'ALL_CORPORATES',
      'SPECIFIC_CORPORATES',
      'ALL_EMPLOYEES',
    ],
  })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE'] })
  @ApiQuery({ name: 'corporateId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: MarkupRuleListResponseOpenApi })
  async list(@Query() query: unknown): Promise<MarkupRuleListResponse> {
    const parsed = MarkupRuleQuerySchema.parse(query ?? {});
    return this.service.list(parsed);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get markup rule by ID' })
  @ApiParam({ name: 'id', description: 'Markup rule ID' })
  @ApiOkResponse({ schema: MarkupRuleRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Markup rule not found' })
  async get(@Param('id') id: string): Promise<MarkupRuleRecord> {
    return this.service.getById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update markup rule status' })
  @ApiParam({ name: 'id', description: 'Markup rule ID' })
  @ApiBody({ schema: UpdateMarkupRuleStatusOpenApi })
  @ApiOkResponse({ schema: MarkupRuleRecordOpenApi })
  async updateStatus(@Param('id') id: string, @Body() body: unknown): Promise<MarkupRuleRecord> {
    const dto = UpdateMarkupRuleStatusSchema.parse(body);
    return this.service.updateStatus(id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Full update of a markup rule' })
  @ApiParam({ name: 'id', description: 'Markup rule ID' })
  @ApiBody({
    schema: UpdateMarkupRuleOpenApi,
    examples: {
      default: { summary: 'Update markup rule', value: UpdateMarkupRuleExample },
    },
  })
  @ApiOkResponse({ schema: MarkupRuleRecordOpenApi })
  async update(@Param('id') id: string, @Body() body: unknown): Promise<MarkupRuleRecord> {
    const dto = UpdateMarkupRuleSchema.parse(body);
    return this.service.update(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update of a markup rule' })
  @ApiParam({ name: 'id', description: 'Markup rule ID' })
  @ApiBody({
    schema: UpdateMarkupRuleOpenApi,
    examples: {
      default: { summary: 'Patch markup rule', value: UpdateMarkupRuleExample },
    },
  })
  @ApiOkResponse({ schema: MarkupRuleRecordOpenApi })
  async patch(@Param('id') id: string, @Body() body: unknown): Promise<MarkupRuleRecord> {
    const dto = UpdateMarkupRuleSchema.parse(body);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a markup rule' })
  @ApiParam({ name: 'id', description: 'Markup rule ID' })
  @ApiOkResponse({ schema: MarkupRuleDeleteResponseOpenApi })
  @ApiNotFoundResponse({ description: 'Markup rule not found' })
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    return this.service.delete(id);
  }
}
