import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { Public, SkipApiResponseWrap } from '@mtw/common';
import { MetricsService } from '@mtw/observability';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Public()
  @SkipApiResponseWrap()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus metrics scrape endpoint' })
  @ApiProduces('text/plain')
  @ApiOkResponse({ description: 'Prometheus text exposition format' })
  async getMetrics(@Res() reply: FastifyReply): Promise<void> {
    const body = await this.metrics.getMetrics();
    reply.type('text/plain; version=0.0.4; charset=utf-8').send(body);
  }
}
