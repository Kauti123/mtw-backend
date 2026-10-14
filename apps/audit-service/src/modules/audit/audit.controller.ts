import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
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
  AuditLogListResponseOpenApi,
  AuditLogRecordOpenApi,
  AuditLogSummaryOpenApi,
  CreateAuditLogExample,
  CreateAuditLogOpenApi,
} from '@mtw/contracts';
import { AuditService } from './audit.service';
import {
  AuditLogQuerySchema,
  CreateAuditLogSchema,
  type AuditLogListResponse,
  type AuditLogRecord,
  type AuditLogSummary,
} from './dto';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get('health')
  @ApiOperation({ summary: 'Audit service health probe' })
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return this.service.health();
  }

  @Get('logs/summary')
  @ApiOperation({ summary: 'Audit log summary counters for Supervision dashboard' })
  @ApiOkResponse({ schema: AuditLogSummaryOpenApi })
  summary(): Promise<AuditLogSummary> {
    return this.service.getSummary();
  }

  @Post('logs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record an audit action (timeline event)',
  })
  @ApiBody({
    schema: CreateAuditLogOpenApi,
    examples: {
      default: { summary: 'Record audit event', value: CreateAuditLogExample },
    },
  })
  @ApiCreatedResponse({
    schema: AuditLogRecordOpenApi,
    description: 'Audit log created',
  })
  async create(
    @Body() body: unknown,
    @Req() req: { ip?: string; headers?: Record<string, unknown> },
    @Headers('user-agent') userAgentHeader?: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('x-correlation-id') correlationHeader?: string,
  ): Promise<AuditLogRecord> {
    const dto = CreateAuditLogSchema.parse(body);
    const forwardedIp =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined;
    return this.service.createLog({
      ...dto,
      ip: dto.ip ?? forwardedIp ?? req.ip ?? null,
      userAgent: dto.userAgent ?? userAgentHeader ?? null,
      correlationId: dto.correlationId ?? correlationHeader,
    });
  }

  @Get('logs')
  @ApiOperation({
    summary: 'List audit action logs (timeline) with filters for Supervision',
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'actorId', required: false, type: String })
  @ApiQuery({ name: 'actorName', required: false, type: String })
  @ApiQuery({ name: 'actorEmail', required: false, type: String })
  @ApiQuery({
    name: 'actorType',
    required: false,
    enum: ['ADMIN_USER', 'USER', 'SYSTEM', 'API_CLIENT', 'PARTNER'],
  })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'resourceType', required: false, type: String })
  @ApiQuery({ name: 'resourceId', required: false, type: String })
  @ApiQuery({ name: 'corporateId', required: false, type: String })
  @ApiQuery({
    name: 'result',
    required: false,
    enum: ['SUCCESS', 'DENIED', 'FAILED', 'PARTIAL'],
  })
  @ApiQuery({ name: 'correlationId', required: false, type: String })
  @ApiQuery({ name: 'ip', required: false, type: String })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'ISO datetime lower bound',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'ISO datetime upper bound',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({
    schema: AuditLogListResponseOpenApi,
    description: 'Paginated audit timeline',
  })
  async list(@Query() query: unknown): Promise<AuditLogListResponse> {
    const parsed = AuditLogQuerySchema.parse(query ?? {});
    return this.service.listLogs(parsed);
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Get audit log detail (includes before/after JSON)' })
  @ApiParam({ name: 'id', description: 'Audit log ID' })
  @ApiOkResponse({ schema: AuditLogRecordOpenApi })
  @ApiNotFoundResponse({ description: 'Audit log not found' })
  async get(@Param('id') id: string): Promise<AuditLogRecord> {
    return this.service.getLogById(id);
  }
}
