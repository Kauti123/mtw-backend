import { DynamicModule, Global, Injectable, Module } from '@nestjs/common';
import { QUEUE_NAMES, type QueueName } from './queue.names';

export { QUEUE_NAMES, type QueueName };

@Injectable()
export class QueueProducer {
  async enqueue(queue: QueueName, payload: unknown): Promise<{ id: string }> {
    // TODO: wire BullMQ when Redis is available
    return { id: `${queue}:${Date.now()}`, ...(typeof payload === 'object' ? {} : {}) };
  }
}

@Global()
@Module({})
export class QueueModule {
  static forRoot(options: { optional?: boolean } = {}): DynamicModule {
    void options;
    return {
      module: QueueModule,
      providers: [QueueProducer],
      exports: [QueueProducer],
    };
  }
}
