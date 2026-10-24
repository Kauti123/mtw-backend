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
  CreateTravelPolicyExample,
  CreateTravelPolicyOpenApi,
  SaveApprovalWorkflowStepExample,
  SaveApprovalWorkflowStepOpenApi,
  SaveAssignmentStepExample,
  SaveAssignmentStepOpenApi,
  SaveBasicInfoStepOpenApi,
  SaveSpendingLimitsStepExample,
  SaveSpendingLimitsStepOpenApi,
  SaveTravelRulesStepExample,
  SaveTravelRulesStepOpenApi,
  TravelPolicyCodeAvailabilityOpenApi,
  TravelPolicyDeleteResponseOpenApi,
  TravelPolicyListResponseOpenApi,
  TravelPolicyRecordOpenApi,
  UpdateTravelPolicyOpenApi,
  UpdateTravelPolicyStatusOpenApi,
} from '@mtw/contracts';
import { PolicyService } from './policies.service';
import {
  CreateTravelPolicySchema,
  SaveApprovalWorkflowStepSchema,
  SaveAssignmentStepSchema,
  SaveBasicInfoStepSchema,
  SaveSpendingLimitsStepSchema,
  SaveTravelRulesStepSchema,
  TravelPolicyQuerySchema,
  UpdateTravelPolicySchema,
  UpdateTravelPolicyStatusSchema,
  type TravelPolicyListResponse,
  type TravelPolicyRecord,
} from './dto';

@ApiTags('policies')
@Controller('policies')
export class PolicyController {
  constructor(private readonly service: PolicyService) {}

  @Get('health')
  @ApiOperation({ summary: 'Policy service health probe' })
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return this.service.health();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create travel policy (Step 1 — Basic Information)',
    description:
      'Creates a DRAFT policy with basic info. Continue with stepwise PATCH endpoints to save Travel Rules, Spending Limits, Approval Workflow, and Assign & Review.',
  })
  @ApiBody({
    schema: CreateTravelPolicyOpenApi,
    examples: {
      default: { summary: 'Create policy draft', value: CreateTravelPolicyExample },
    },
  })
  @ApiCreatedResponse({ schema: TravelPolicyRecordOpenApi })
  @ApiConflictResponse({ description: 'Policy code already exists' })
  async create(@Body() body: unknown): Promise<TravelPolicyRecord> {
    const dto = CreateTravelPolicySchema.parse(body);
    return this.service.createPolicy(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List travel policies' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'ACTIVE', 'INACTIVE'],
  })
  @ApiQuery({
    name: 'policyType',
    required: false,
    enum: ['STANDARD', 'CUSTOM', 'STRICT', 'FLEXIBLE'],
  })
  @ApiQuery({
    name: 'applicableTo',
    required: false,
    enum: [
      'ALL_EMPLOYEES',
      'SPECIFIC_DEPARTMENTS',
      'SPECIFIC_COST_CENTERS',
      'SPECIFIC_EMPLOYEES_GROUPS',
    ],
  })
  @ApiQuery({ name: 'corporateId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: TravelPolicyListResponseOpenApi })
  async list(@Query() query: unknown): Promise<TravelPolicyListResponse> {
    const parsed = TravelPolicyQuerySchema.parse(query ?? {});
    return this.service.listPolicies(parsed);
  }

  @Get('check-code/:code')
  @ApiOperation({ summary: 'Check if a policy code is available' })
  @ApiParam({ name: 'code', description: 'Policy code (e.g. POL001)' })
  @ApiOkResponse({ schema: TravelPolicyCodeAvailabilityOpenApi })
  async checkCode(@Param('code') code: string): Promise<{ code: string; available: boolean }> {
    return this.service.checkCodeAvailability(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get travel policy by ID or code' })
  @ApiParam({ name: 'id', description: 'Policy ID or code' })
  @ApiOkResponse({ schema: TravelPolicyRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Policy not found' })
  async get(@Param('id') id: string): Promise<TravelPolicyRecord> {
    return this.service.getPolicyById(id);
  }

  @Patch(':id/steps/basic-info')
  @ApiOperation({ summary: 'Save Step 1 — Basic Information' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiBody({
    schema: SaveBasicInfoStepOpenApi,
    examples: {
      default: { summary: 'Basic info', value: CreateTravelPolicyExample },
    },
  })
  @ApiOkResponse({ schema: TravelPolicyRecordOpenApi })
  async saveBasicInfo(@Param('id') id: string, @Body() body: unknown): Promise<TravelPolicyRecord> {
    const dto = SaveBasicInfoStepSchema.parse(body);
    return this.service.saveBasicInfoStep(id, dto);
  }

  @Patch(':id/steps/travel-rules')
  @ApiOperation({
    summary: 'Save Step 2 — Travel Rules (Flights, Hotels, Ground, Trains, Other)',
  })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiBody({
    schema: SaveTravelRulesStepOpenApi,
    examples: {
      default: { summary: 'Travel rules', value: SaveTravelRulesStepExample },
    },
  })
  @ApiOkResponse({ schema: TravelPolicyRecordOpenApi })
  async saveTravelRules(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<TravelPolicyRecord> {
    const dto = SaveTravelRulesStepSchema.parse(body);
    return this.service.saveTravelRulesStep(id, dto);
  }

  @Patch(':id/steps/spending-limits')
  @ApiOperation({ summary: 'Save Step 3 — Spending Limits' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiBody({
    schema: SaveSpendingLimitsStepOpenApi,
    examples: {
      default: {
        summary: 'Spending limits',
        value: SaveSpendingLimitsStepExample,
      },
    },
  })
  @ApiOkResponse({ schema: TravelPolicyRecordOpenApi })
  async saveSpendingLimits(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<TravelPolicyRecord> {
    const dto = SaveSpendingLimitsStepSchema.parse(body);
    return this.service.saveSpendingLimitsStep(id, dto);
  }

  @Patch(':id/steps/approval-workflow')
  @ApiOperation({ summary: 'Save Step 4 — Approval Workflow' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiBody({
    schema: SaveApprovalWorkflowStepOpenApi,
    examples: {
      default: {
        summary: 'Approval workflow',
        value: SaveApprovalWorkflowStepExample,
      },
    },
  })
  @ApiOkResponse({ schema: TravelPolicyRecordOpenApi })
  async saveApprovalWorkflow(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<TravelPolicyRecord> {
    const dto = SaveApprovalWorkflowStepSchema.parse(body);
    return this.service.saveApprovalWorkflowStep(id, dto);
  }

  @Patch(':id/steps/assignment')
  @ApiOperation({
    summary: 'Save Step 5 — Assign & Review',
    description: 'Set `publish: true` to mark the policy ACTIVE after review.',
  })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiBody({
    schema: SaveAssignmentStepOpenApi,
    examples: {
      default: { summary: 'Assign & review', value: SaveAssignmentStepExample },
    },
  })
  @ApiOkResponse({ schema: TravelPolicyRecordOpenApi })
  async saveAssignment(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<TravelPolicyRecord> {
    const dto = SaveAssignmentStepSchema.parse(body);
    return this.service.saveAssignmentStep(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update travel policy status' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiBody({ schema: UpdateTravelPolicyStatusOpenApi })
  @ApiOkResponse({ schema: TravelPolicyRecordOpenApi })
  async updateStatus(@Param('id') id: string, @Body() body: unknown): Promise<TravelPolicyRecord> {
    const dto = UpdateTravelPolicyStatusSchema.parse(body);
    return this.service.updateStatus(id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Full / partial update of a travel policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiBody({ schema: UpdateTravelPolicyOpenApi })
  @ApiOkResponse({ schema: TravelPolicyRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Policy not found' })
  async update(@Param('id') id: string, @Body() body: unknown): Promise<TravelPolicyRecord> {
    const dto = UpdateTravelPolicySchema.parse(body);
    return this.service.updatePolicy(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update of a travel policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiBody({ schema: UpdateTravelPolicyOpenApi })
  @ApiOkResponse({ schema: TravelPolicyRecordOpenApi })
  async patch(@Param('id') id: string, @Body() body: unknown): Promise<TravelPolicyRecord> {
    const dto = UpdateTravelPolicySchema.parse(body);
    return this.service.updatePolicy(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a travel policy' })
  @ApiParam({ name: 'id', description: 'Policy ID' })
  @ApiOkResponse({ schema: TravelPolicyDeleteResponseOpenApi })
  @ApiNotFoundResponse({ description: 'Policy not found' })
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    return this.service.deletePolicy(id);
  }
}
