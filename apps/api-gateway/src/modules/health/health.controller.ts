import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';
import { Public } from '@mtw/common';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthService: HealthService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Full health check including Redis and database' })
  @ApiOkResponse({ description: 'All health indicators passed' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.healthService.isAlive(),
      () => this.healthService.checkRedis(),
      () => this.healthService.checkDatabase(),
    ]);
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Process is alive' })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe for Redis and database' })
  @ApiOkResponse({ description: 'Dependencies are ready' })
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.healthService.checkRedis(),
      () => this.healthService.checkDatabase(),
    ]);
  }
}
