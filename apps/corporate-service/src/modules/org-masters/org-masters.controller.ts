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
import {
  CreateCostCenterExample,
  CreateDepartmentExample,
  CreateOrgMasterOpenApi,
  CreatePositionExample,
  OrgMasterDeleteResponseOpenApi,
  OrgMasterListResponseOpenApi,
  OrgMasterRecordOpenApi,
  UpdateOrgMasterOpenApi,
} from '@mtw/contracts';
import { OrgMastersService } from './org-masters.service';
import {
  CreateOrgMasterSchema,
  OrgMasterQuerySchema,
  UpdateOrgMasterSchema,
  type OrgMasterListResponse,
  type OrgMasterRecord,
} from './dto';

@ApiTags('departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly service: OrgMastersService) {}

  @Get('health')
  @ApiOperation({ summary: 'Departments module health probe' })
  @ApiOkResponse({ description: 'Module is healthy' })
  health() {
    return this.service.health('department');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a department' })
  @ApiBody({
    schema: CreateOrgMasterOpenApi,
    examples: { default: { summary: 'Create department', value: CreateDepartmentExample } },
  })
  @ApiCreatedResponse({ schema: OrgMasterRecordOpenApi })
  @ApiConflictResponse({ description: 'Name or code already exists' })
  async create(@Body() body: unknown): Promise<OrgMasterRecord> {
    return this.service.create('department', CreateOrgMasterSchema.parse(body));
  }

  @Get()
  @ApiOperation({ summary: 'List departments' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'corporateId', required: false, type: String })
  @ApiQuery({ name: 'corporateCode', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: OrgMasterListResponseOpenApi })
  async list(@Query() query: unknown): Promise<OrgMasterListResponse> {
    return this.service.list('department', OrgMasterQuerySchema.parse(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ schema: OrgMasterRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Not found' })
  async getById(@Param('id') id: string): Promise<OrgMasterRecord> {
    return this.service.getById('department', id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a department' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: UpdateOrgMasterOpenApi })
  @ApiOkResponse({ schema: OrgMasterRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Not found' })
  @ApiConflictResponse({ description: 'Name or code already exists' })
  async update(@Param('id') id: string, @Body() body: unknown): Promise<OrgMasterRecord> {
    return this.service.update('department', id, UpdateOrgMasterSchema.parse(body));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ schema: OrgMasterDeleteResponseOpenApi })
  @ApiNotFoundResponse({ description: 'Not found' })
  async remove(@Param('id') id: string) {
    return this.service.remove('department', id);
  }
}

@ApiTags('positions')
@Controller('positions')
export class PositionsController {
  constructor(private readonly service: OrgMastersService) {}

  @Get('health')
  @ApiOperation({ summary: 'Positions module health probe' })
  @ApiOkResponse({ description: 'Module is healthy' })
  health() {
    return this.service.health('position');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a position' })
  @ApiBody({
    schema: CreateOrgMasterOpenApi,
    examples: { default: { summary: 'Create position', value: CreatePositionExample } },
  })
  @ApiCreatedResponse({ schema: OrgMasterRecordOpenApi })
  @ApiConflictResponse({ description: 'Name or code already exists' })
  async create(@Body() body: unknown): Promise<OrgMasterRecord> {
    return this.service.create('position', CreateOrgMasterSchema.parse(body));
  }

  @Get()
  @ApiOperation({ summary: 'List positions' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'corporateId', required: false, type: String })
  @ApiQuery({ name: 'corporateCode', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: OrgMasterListResponseOpenApi })
  async list(@Query() query: unknown): Promise<OrgMasterListResponse> {
    return this.service.list('position', OrgMasterQuerySchema.parse(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get position by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ schema: OrgMasterRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Not found' })
  async getById(@Param('id') id: string): Promise<OrgMasterRecord> {
    return this.service.getById('position', id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a position' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: UpdateOrgMasterOpenApi })
  @ApiOkResponse({ schema: OrgMasterRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Not found' })
  @ApiConflictResponse({ description: 'Name or code already exists' })
  async update(@Param('id') id: string, @Body() body: unknown): Promise<OrgMasterRecord> {
    return this.service.update('position', id, UpdateOrgMasterSchema.parse(body));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a position' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ schema: OrgMasterDeleteResponseOpenApi })
  @ApiNotFoundResponse({ description: 'Not found' })
  async remove(@Param('id') id: string) {
    return this.service.remove('position', id);
  }
}

@ApiTags('cost-centers')
@Controller('cost-centers')
export class CostCentersController {
  constructor(private readonly service: OrgMastersService) {}

  @Get('health')
  @ApiOperation({ summary: 'Cost centers module health probe' })
  @ApiOkResponse({ description: 'Module is healthy' })
  health() {
    return this.service.health('cost-center');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a cost center' })
  @ApiBody({
    schema: CreateOrgMasterOpenApi,
    examples: { default: { summary: 'Create cost center', value: CreateCostCenterExample } },
  })
  @ApiCreatedResponse({ schema: OrgMasterRecordOpenApi })
  @ApiConflictResponse({ description: 'Name or code already exists' })
  async create(@Body() body: unknown): Promise<OrgMasterRecord> {
    return this.service.create('cost-center', CreateOrgMasterSchema.parse(body));
  }

  @Get()
  @ApiOperation({ summary: 'List cost centers' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'corporateId', required: false, type: String })
  @ApiQuery({ name: 'corporateCode', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: OrgMasterListResponseOpenApi })
  async list(@Query() query: unknown): Promise<OrgMasterListResponse> {
    return this.service.list('cost-center', OrgMasterQuerySchema.parse(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cost center by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ schema: OrgMasterRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Not found' })
  async getById(@Param('id') id: string): Promise<OrgMasterRecord> {
    return this.service.getById('cost-center', id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a cost center' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: UpdateOrgMasterOpenApi })
  @ApiOkResponse({ schema: OrgMasterRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Not found' })
  @ApiConflictResponse({ description: 'Name or code already exists' })
  async update(@Param('id') id: string, @Body() body: unknown): Promise<OrgMasterRecord> {
    return this.service.update('cost-center', id, UpdateOrgMasterSchema.parse(body));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cost center' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ schema: OrgMasterDeleteResponseOpenApi })
  @ApiNotFoundResponse({ description: 'Not found' })
  async remove(@Param('id') id: string) {
    return this.service.remove('cost-center', id);
  }
}
