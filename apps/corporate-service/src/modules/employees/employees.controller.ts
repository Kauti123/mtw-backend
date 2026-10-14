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
  CreateEmployeeExample,
  CreateEmployeeOpenApi,
  EmployeeDeleteResponseOpenApi,
  EmployeeListResponseOpenApi,
  EmployeeNextCodeOpenApi,
  EmployeeRecordOpenApi,
  EmployeeUniqueCheckOpenApi,
  UpdateEmployeeExample,
  UpdateEmployeeOpenApi,
  UpdateEmployeeStatusOpenApi,
} from '@mtw/contracts';
import { EmployeesService } from './employees.service';
import {
  CreateEmployeeSchema,
  EmployeeQuerySchema,
  UpdateEmployeeSchema,
  UpdateEmployeeStatusSchema,
  type EmployeeListResponse,
  type EmployeeRecord,
} from './dto';

@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get('health')
  @ApiOperation({ summary: 'Employees module health probe' })
  @ApiOkResponse({ description: 'Module is healthy' })
  health() {
    return this.service.health();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an employee' })
  @ApiBody({
    schema: CreateEmployeeOpenApi,
    examples: {
      default: {
        summary: 'Create Employee form',
        value: CreateEmployeeExample,
      },
    },
  })
  @ApiCreatedResponse({ schema: EmployeeRecordOpenApi })
  @ApiConflictResponse({ description: 'Employee code or email already exists' })
  async create(@Body() body: unknown): Promise<EmployeeRecord> {
    const dto = CreateEmployeeSchema.parse(body);
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List employees' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'PENDING', 'INACTIVE'],
  })
  @ApiQuery({ name: 'departmentName', required: false, type: String })
  @ApiQuery({ name: 'position', required: false, type: String })
  @ApiQuery({ name: 'corporateId', required: false, type: String })
  @ApiQuery({ name: 'corporateCode', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: EmployeeListResponseOpenApi })
  async list(@Query() query: unknown): Promise<EmployeeListResponse> {
    const parsed = EmployeeQuerySchema.parse(query ?? {});
    return this.service.list(parsed);
  }

  @Get('next-code')
  @ApiOperation({ summary: 'Generate the next employee code' })
  @ApiQuery({ name: 'corporateId', required: false, type: String })
  @ApiQuery({ name: 'corporateCode', required: false, type: String })
  @ApiOkResponse({ schema: EmployeeNextCodeOpenApi })
  async nextCode(
    @Query('corporateId') corporateId?: string,
    @Query('corporateCode') corporateCode?: string,
  ): Promise<{ employeeCode: string }> {
    return this.service.nextCode(corporateId, corporateCode);
  }

  @Get('check-code/:code')
  @ApiOperation({ summary: 'Check if an employee code is available' })
  @ApiParam({ name: 'code', description: 'Employee code (e.g. EMP-1010)' })
  @ApiQuery({ name: 'corporateId', required: false, type: String })
  @ApiQuery({ name: 'corporateCode', required: false, type: String })
  @ApiOkResponse({ schema: EmployeeUniqueCheckOpenApi })
  async checkCode(
    @Param('code') code: string,
    @Query('corporateId') corporateId?: string,
    @Query('corporateCode') corporateCode?: string,
  ): Promise<{ employeeCode: string; available: boolean }> {
    return this.service.checkCodeAvailability(code, corporateId, corporateCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiOkResponse({ schema: EmployeeRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  async get(@Param('id') id: string): Promise<EmployeeRecord> {
    return this.service.getById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update employee status' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiBody({ schema: UpdateEmployeeStatusOpenApi })
  @ApiOkResponse({ schema: EmployeeRecordOpenApi })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<EmployeeRecord> {
    const dto = UpdateEmployeeStatusSchema.parse(body);
    return this.service.updateStatus(id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Full update of an employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiBody({
    schema: UpdateEmployeeOpenApi,
    examples: {
      default: { summary: 'Update employee', value: UpdateEmployeeExample },
    },
  })
  @ApiOkResponse({ schema: EmployeeRecordOpenApi })
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<EmployeeRecord> {
    const dto = UpdateEmployeeSchema.parse(body);
    return this.service.update(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update of an employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiBody({
    schema: UpdateEmployeeOpenApi,
    examples: {
      default: { summary: 'Patch employee', value: UpdateEmployeeExample },
    },
  })
  @ApiOkResponse({ schema: EmployeeRecordOpenApi })
  async patch(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<EmployeeRecord> {
    const dto = UpdateEmployeeSchema.parse(body);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiOkResponse({ schema: EmployeeDeleteResponseOpenApi })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    return this.service.delete(id);
  }
}
