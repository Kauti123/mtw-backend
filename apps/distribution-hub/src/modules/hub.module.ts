import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { HttpClientModule } from '@mtw/http-client';
import { MockHotelAdapter } from '../adapters/hotel/mock/mock.adapter';
import { MockClient } from '../adapters/hotel/mock/mock.client';
import { TboAdapter } from '../adapters/hotel/tbo/tbo.adapter';
import { TboClient } from '../adapters/hotel/tbo/tbo.client';
import { HotelbedsAdapter } from '../adapters/hotel/hotelbeds/hotelbeds.adapter';
import { HotelbedsClient } from '../adapters/hotel/hotelbeds/hotelbeds.client';
import { HotelCrsAdapter } from '../adapters/hotel/hotel-crs/hotel-crs.adapter';
import { HotelCrsClient } from '../adapters/hotel/hotel-crs/hotel-crs.client';
import { GtaAdapter } from '../adapters/hotel/gta/gta.adapter';
import { GtaClient } from '../adapters/hotel/gta/gta.client';
import { AmadeusAdapter } from '../adapters/flight/amadeus/amadeus.adapter';
import { AmadeusClient } from '../adapters/flight/amadeus/amadeus.client';
import { SabreAdapter } from '../adapters/flight/sabre/sabre.adapter';
import { SabreClient } from '../adapters/flight/sabre/sabre.client';
import { TravelportAdapter } from '../adapters/flight/travelport/travelport.adapter';
import { TravelportClient } from '../adapters/flight/travelport/travelport.client';
import { AirlineDirectAdapter } from '../adapters/flight/airline-direct/airline-direct.adapter';
import { AirlineDirectClient } from '../adapters/flight/airline-direct/airline-direct.client';
import { GenericBusAdapter } from '../adapters/bus/generic-bus/generic-bus.adapter';
import { GenericBusClient } from '../adapters/bus/generic-bus/generic-bus.client';
import { GenericCabAdapter } from '../adapters/cab/generic-cab/generic-cab.adapter';
import { GenericCabClient } from '../adapters/cab/generic-cab/generic-cab.client';
import { GenericTrainAdapter } from '../adapters/train/generic-train/generic-train.adapter';
import { GenericTrainClient } from '../adapters/train/generic-train/generic-train.client';
import { AdapterRegistry } from './registry/adapter-registry.service';
import { RoutingEngine } from './routing/routing.engine';
import { BookingOrchestrator } from './orchestrator/booking.orchestrator';
import { HubController } from './hub.controller';
import { SearchCacheService } from './cache/search-cache.service';
import { SupplierLogService } from './logging/supplier-log.service';
import { HotelMappingService } from './mapping/hotel-mapping.service';

@Module({
  imports: [DiscoveryModule, HttpClientModule],
  controllers: [HubController],
  providers: [
    MockHotelAdapter,
    MockClient,
    TboAdapter,
    TboClient,
    HotelbedsAdapter,
    HotelbedsClient,
    HotelCrsAdapter,
    HotelCrsClient,
    GtaAdapter,
    GtaClient,
    AmadeusAdapter,
    AmadeusClient,
    SabreAdapter,
    SabreClient,
    TravelportAdapter,
    TravelportClient,
    AirlineDirectAdapter,
    AirlineDirectClient,
    GenericBusAdapter,
    GenericBusClient,
    GenericCabAdapter,
    GenericCabClient,
    GenericTrainAdapter,
    GenericTrainClient,
    AdapterRegistry,
    RoutingEngine,
    BookingOrchestrator,
    SearchCacheService,
    SupplierLogService,
    HotelMappingService,
  ],
  exports: [BookingOrchestrator, AdapterRegistry, RoutingEngine, SearchCacheService, HotelMappingService],
})
export class DistributionHubModule {}
