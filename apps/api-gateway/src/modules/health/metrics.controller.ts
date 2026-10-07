import { Controller, Get, Header, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { MetricsService } from '@mtw/observability';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(@Res() reply: FastifyReply): Promise<void> {
    const body = await this.metrics.getMetrics();
    reply.type('text/plain; version=0.0.4; charset=utf-8').send(body);
  }
}
