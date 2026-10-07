import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import type { Vertical } from '@mtw/contracts';
import {
  ADAPTER_META_KEY,
  type AdapterMeta,
  type SupplierAdapter,
} from '../../adapters/adapter.types';

@Injectable()
export class AdapterRegistry implements OnModuleInit {
  private readonly logger = new Logger(AdapterRegistry.name);
  private readonly adapters = new Map<string, SupplierAdapter>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit(): void {
    const wrappers = [
      ...this.discovery.getProviders(),
      ...this.discovery.getControllers(),
    ];

    for (const wrapper of wrappers) {
      const instance = wrapper.instance as SupplierAdapter | undefined;
      if (!instance || typeof instance !== 'object') continue;
      const meta = this.reflector.get<AdapterMeta | undefined>(
        ADAPTER_META_KEY,
        instance.constructor,
      );
      if (!meta) continue;
      const key = this.key(meta.code, meta.vertical);
      this.adapters.set(key, instance);
      this.logger.log(`Registered adapter ${meta.code}/${meta.vertical} v${meta.version}`);
    }
  }

  private key(code: string, vertical: Vertical): string {
    return `${vertical}:${code}`.toUpperCase();
  }

  get(code: string, vertical: Vertical): SupplierAdapter | undefined {
    return this.adapters.get(this.key(code, vertical));
  }

  listByVertical(vertical: Vertical): SupplierAdapter[] {
    return [...this.adapters.values()].filter((a) => a.meta.vertical === vertical);
  }

  listEnabled(): SupplierAdapter[] {
    return [...this.adapters.values()];
  }
}
