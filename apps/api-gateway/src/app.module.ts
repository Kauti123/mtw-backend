import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@mtw/config';
import {
  ProblemDetailsFilter,
  CorrelationIdInterceptor,
  TransformResponseInterceptor,
} from '@mtw/common';
import { ObservabilityModule } from '@mtw/observability';
import { DatabaseModule } from '@mtw/database';
import { CacheModule } from '@mtw/cache';
import { SecurityModule } from '@mtw/security';
import { MessagingModule } from '@mtw/messaging';
import { HttpClientModule } from '@mtw/http-client';
import { QueueModule } from '@mtw/queue';
import { AdminUsersModule, AuthModule } from '../../auth-service/src';
import { PermissionsModule, RolesModule, UsersModule } from '../../user-service/src';
import { CorporateCodesModule, CorporateModule, WalletsModule } from '../../corporate-service/src';
import { BookingModule } from '../../booking-service/src';
import { PolicyModule } from '../../policy-service/src';
import { SupplierModule } from '../../supplier-service/src';
import { DistributionHubModule } from '../../distribution-hub/src';
import { CommercialModule, MarkupRulesModule, PricingModule } from '../../pricing-service/src';
import { PaymentModule } from '../../payment-service/src';
import { NotificationModule } from '../../notification-service/src';
import { ReportingModule } from '../../reporting-service/src';
import { MasterDataModule } from '../../masterdata-service/src';
import { TripModule } from '../../trip-service/src';
import { CostModule } from '../../cost-service/src';
import { CMSModule } from '../../cms-service/src';
import { AuditModule } from '../../audit-service/src';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/health/metrics.module';
import { AdminBffModule } from './modules/bff/admin/admin-bff.module';
import { CorporateBffModule } from './modules/bff/corporate/corporate-bff.module';
import { EmployeeBffModule } from './modules/bff/employee/employee-bff.module';
import { SupplierBffModule } from './modules/bff/supplier/supplier-bff.module';
import { PartnerBffModule } from './modules/bff/partner/partner-bff.module';

@Module({
  imports: [
    ConfigModule,
    ObservabilityModule,
    SecurityModule,
    MessagingModule,
    HttpClientModule,
    QueueModule.forRoot({ optional: true }),
    DatabaseModule.forRoot({ optional: true }),
    CacheModule.forRoot({ optional: true }),
    HealthModule,
    MetricsModule,
    AuthModule,
    AdminUsersModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CorporateModule,
    CorporateCodesModule,
    WalletsModule,
    BookingModule,
    PolicyModule,
    SupplierModule,
    DistributionHubModule,
    PricingModule,
    MarkupRulesModule,
    CommercialModule,
    PaymentModule,
    NotificationModule,
    ReportingModule,
    MasterDataModule,
    TripModule,
    CostModule,
    CMSModule,
    AuditModule,
    AdminBffModule,
    CorporateBffModule,
    EmployeeBffModule,
    SupplierBffModule,
    PartnerBffModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
    // Global JwtAuthGuard is registered once via SecurityModule (APP_GUARD).
  ],
})
export class AppModule {}
