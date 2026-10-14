import { Global, Injectable, Module } from '@nestjs/common';
import type { DomainEvent } from '@mtw/contracts';

export type MessageHandler = (event: DomainEvent) => Promise<void> | void;

@Injectable()
export class EventBusService {
  private readonly handlers = new Map<string, Set<MessageHandler>>();

  on(eventType: string, handler: MessageHandler): void {
    const set = this.handlers.get(eventType) ?? new Set<MessageHandler>();
    set.add(handler);
    this.handlers.set(eventType, set);
  }

  async publish(event: DomainEvent): Promise<void> {
    const set = this.handlers.get(event.eventType);
    if (!set) return;
    for (const handler of set) {
      await handler(event);
    }
  }

  async request<TResponse>(
    _pattern: string,
    payload: unknown,
    handler: (payload: unknown) => Promise<TResponse>,
  ): Promise<TResponse> {
    // Monolith: in-process; microservices: swap to NATS via MESSAGING_TRANSPORT
    return handler(payload);
  }
}

@Injectable()
export class OutboxRelayService {
  constructor(private readonly bus: EventBusService) {}

  async relay(event: DomainEvent): Promise<void> {
    await this.bus.publish(event);
  }
}

@Global()
@Module({
  providers: [EventBusService, OutboxRelayService],
  exports: [EventBusService, OutboxRelayService],
})
export class MessagingModule {}
