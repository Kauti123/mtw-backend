import { zodToOpenAPI } from 'nestjs-zod';
import type { ZodTypeAny } from 'zod';
import {
  BaseCorporateSchema,
  CorporateCodeAvailabilitySchema,
  CorporateDeleteResponseSchema,
  CorporateListResponseSchema,
  CorporateRecordSchema,
  UpdateCorporateStatusSchema,
} from './corporate';
import {
  BaseCorporateCodeSchema,
  CorporateCodeDeleteResponseSchema,
  CorporateCodeListResponseSchema,
  CorporateCodeRecordSchema,
  CorporateCodeUniqueCheckSchema,
  UpdateCorporateCodeStatusBodySchema,
} from './corporate-code';
import {
  BaseRoleSchema,
  RoleCodeAvailabilitySchema,
  RoleDeleteResponseSchema,
  RoleListResponseSchema,
  RoleRecordSchema,
  UpdateRoleStatusBodySchema,
} from './roles';
import {
  BasePermissionModuleSchema,
  PermissionBodySchema,
  PermissionCodeAvailabilitySchema,
  PermissionDeleteResponseSchema,
  PermissionListResponseSchema,
  PermissionMatrixResponseSchema,
  PermissionModuleRecordSchema,
  PermissionRecordSchema,
} from './permissions';
import {
  AdminAuthTokenResponseSchema,
  AdminEmailAvailabilitySchema,
  AdminLoginSchema,
  AdminRefreshSchema,
  AdminUserDeleteResponseSchema,
  AdminUserListResponseSchema,
  AdminUserRecordSchema,
  ChangeAdminPasswordSchema,
  CreateAdminUserBodySchema,
  UpdateAdminUserBodySchema,
  UpdateAdminUserStatusBodySchema,
} from './admin-user';
import {
  AuditLogListResponseSchema,
  AuditLogRecordSchema,
  AuditLogSummarySchema,
  CreateAuditLogBodySchema,
} from './audit';
import {
  BaseConvenienceFeeSchema,
  BaseDiscountRuleSchema,
  BaseGstRuleSchema,
  BaseServiceFeeSchema,
  BaseSupplierCommissionSchema,
  CommercialDeleteResponseSchema,
  ConvenienceFeeListResponseSchema,
  ConvenienceFeeRecordSchema,
  DiscountRuleListResponseSchema,
  DiscountRuleRecordSchema,
  GstRuleListResponseSchema,
  GstRuleRecordSchema,
  ServiceFeeListResponseSchema,
  ServiceFeeRecordSchema,
  SupplierCommissionListResponseSchema,
  SupplierCommissionRecordSchema,
  UpdateCommercialStatusBodySchema,
} from './commercial';
import {
  MarkupRuleBodySchema,
  MarkupRuleDeleteResponseSchema,
  MarkupRuleListResponseSchema,
  MarkupRuleRecordSchema,
  UpdateMarkupRuleStatusBodySchema,
} from './markup-rule';
import {
  BasicInfoSchema,
  SaveApprovalWorkflowStepSchema,
  SaveAssignmentStepSchema,
  SaveSpendingLimitsStepSchema,
  SaveTravelRulesStepSchema,
  TravelPolicyCodeAvailabilitySchema,
  TravelPolicyDeleteResponseSchema,
  TravelPolicyListResponseSchema,
  TravelPolicyRecordSchema,
} from './travel-policy';
import {
  BookingConfirmationSchema,
  BookingRequestSchema,
  CancellationResultSchema,
  HubCancelRequestSchema,
  SearchRequestSchema,
  SearchResultSchema,
} from './travel';
import { z } from 'zod';

export function toOpenApi(schema: ZodTypeAny) {
  return zodToOpenAPI(schema as never);
}

export const CreateCorporateOpenApi = toOpenApi(BaseCorporateSchema);
export const UpdateCorporateOpenApi = toOpenApi(BaseCorporateSchema.partial());
export const UpdateCorporateStatusOpenApi = toOpenApi(UpdateCorporateStatusSchema);
export const CorporateRecordOpenApi = toOpenApi(CorporateRecordSchema);
export const CorporateListResponseOpenApi = toOpenApi(CorporateListResponseSchema);
export const CorporateCodeAvailabilityOpenApi = toOpenApi(CorporateCodeAvailabilitySchema);
export const CorporateDeleteResponseOpenApi = toOpenApi(CorporateDeleteResponseSchema);
export const CreateCorporateCodeOpenApi = toOpenApi(BaseCorporateCodeSchema);
export const UpdateCorporateCodeOpenApi = toOpenApi(BaseCorporateCodeSchema.partial());
export const CorporateCodeRecordOpenApi = toOpenApi(CorporateCodeRecordSchema);
export const CorporateCodeListResponseOpenApi = toOpenApi(CorporateCodeListResponseSchema);
export const CorporateCodeUniqueCheckOpenApi = toOpenApi(CorporateCodeUniqueCheckSchema);
export const CorporateCodeDeleteResponseOpenApi = toOpenApi(CorporateCodeDeleteResponseSchema);
export const UpdateCorporateCodeStatusOpenApi = toOpenApi(UpdateCorporateCodeStatusBodySchema);
export const CreateRoleOpenApi = toOpenApi(BaseRoleSchema);
export const UpdateRoleOpenApi = toOpenApi(BaseRoleSchema.partial());
export const UpdateRoleStatusOpenApi = toOpenApi(UpdateRoleStatusBodySchema);
export const RoleRecordOpenApi = toOpenApi(RoleRecordSchema);
export const RoleListResponseOpenApi = toOpenApi(RoleListResponseSchema);
export const RoleCodeAvailabilityOpenApi = toOpenApi(RoleCodeAvailabilitySchema);
export const RoleDeleteResponseOpenApi = toOpenApi(RoleDeleteResponseSchema);
export const CreatePermissionOpenApi = toOpenApi(PermissionBodySchema);
export const UpdatePermissionOpenApi = toOpenApi(PermissionBodySchema.partial());
export const PermissionRecordOpenApi = toOpenApi(PermissionRecordSchema);
export const PermissionListResponseOpenApi = toOpenApi(PermissionListResponseSchema);
export const PermissionMatrixResponseOpenApi = toOpenApi(PermissionMatrixResponseSchema);
export const PermissionDeleteResponseOpenApi = toOpenApi(PermissionDeleteResponseSchema);
export const PermissionCodeAvailabilityOpenApi = toOpenApi(PermissionCodeAvailabilitySchema);
export const CreatePermissionModuleOpenApi = toOpenApi(BasePermissionModuleSchema);
export const UpdatePermissionModuleOpenApi = toOpenApi(BasePermissionModuleSchema.partial());
export const PermissionModuleRecordOpenApi = toOpenApi(PermissionModuleRecordSchema);
export const CreateTravelPolicyOpenApi = toOpenApi(BasicInfoSchema);
export const UpdateTravelPolicyOpenApi = toOpenApi(BasicInfoSchema.partial());
export const TravelPolicyRecordOpenApi = toOpenApi(TravelPolicyRecordSchema);
export const TravelPolicyListResponseOpenApi = toOpenApi(TravelPolicyListResponseSchema);
export const TravelPolicyCodeAvailabilityOpenApi = toOpenApi(TravelPolicyCodeAvailabilitySchema);
export const TravelPolicyDeleteResponseOpenApi = toOpenApi(TravelPolicyDeleteResponseSchema);
export const SaveBasicInfoStepOpenApi = toOpenApi(BasicInfoSchema);
export const SaveTravelRulesStepOpenApi = toOpenApi(SaveTravelRulesStepSchema);
export const SaveSpendingLimitsStepOpenApi = toOpenApi(SaveSpendingLimitsStepSchema);
export const SaveApprovalWorkflowStepOpenApi = toOpenApi(SaveApprovalWorkflowStepSchema);
export const SaveAssignmentStepOpenApi = toOpenApi(SaveAssignmentStepSchema);
export const UpdateTravelPolicyStatusOpenApi = toOpenApi(
  z.object({
    status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']),
    reason: z.string().optional(),
    updatedBy: z.string().optional().nullable(),
  }),
);
export const CreateMarkupRuleOpenApi = toOpenApi(MarkupRuleBodySchema);
export const UpdateMarkupRuleOpenApi = toOpenApi(MarkupRuleBodySchema.partial());
export const MarkupRuleRecordOpenApi = toOpenApi(MarkupRuleRecordSchema);
export const MarkupRuleListResponseOpenApi = toOpenApi(MarkupRuleListResponseSchema);
export const MarkupRuleDeleteResponseOpenApi = toOpenApi(MarkupRuleDeleteResponseSchema);
export const UpdateMarkupRuleStatusOpenApi = toOpenApi(UpdateMarkupRuleStatusBodySchema);
export const CreateSupplierCommissionOpenApi = toOpenApi(BaseSupplierCommissionSchema);
export const UpdateSupplierCommissionOpenApi = toOpenApi(BaseSupplierCommissionSchema.partial());
export const SupplierCommissionRecordOpenApi = toOpenApi(SupplierCommissionRecordSchema);
export const SupplierCommissionListResponseOpenApi = toOpenApi(
  SupplierCommissionListResponseSchema,
);
export const CreateServiceFeeOpenApi = toOpenApi(BaseServiceFeeSchema);
export const UpdateServiceFeeOpenApi = toOpenApi(BaseServiceFeeSchema.partial());
export const ServiceFeeRecordOpenApi = toOpenApi(ServiceFeeRecordSchema);
export const ServiceFeeListResponseOpenApi = toOpenApi(ServiceFeeListResponseSchema);
export const CreateConvenienceFeeOpenApi = toOpenApi(BaseConvenienceFeeSchema);
export const UpdateConvenienceFeeOpenApi = toOpenApi(BaseConvenienceFeeSchema.partial());
export const ConvenienceFeeRecordOpenApi = toOpenApi(ConvenienceFeeRecordSchema);
export const ConvenienceFeeListResponseOpenApi = toOpenApi(ConvenienceFeeListResponseSchema);
export const CreateDiscountRuleOpenApi = toOpenApi(BaseDiscountRuleSchema);
export const UpdateDiscountRuleOpenApi = toOpenApi(BaseDiscountRuleSchema.partial());
export const DiscountRuleRecordOpenApi = toOpenApi(DiscountRuleRecordSchema);
export const DiscountRuleListResponseOpenApi = toOpenApi(DiscountRuleListResponseSchema);
export const CreateGstRuleOpenApi = toOpenApi(BaseGstRuleSchema);
export const UpdateGstRuleOpenApi = toOpenApi(BaseGstRuleSchema.partial());
export const GstRuleRecordOpenApi = toOpenApi(GstRuleRecordSchema);
export const GstRuleListResponseOpenApi = toOpenApi(GstRuleListResponseSchema);
export const CommercialDeleteResponseOpenApi = toOpenApi(CommercialDeleteResponseSchema);
export const UpdateCommercialStatusOpenApi = toOpenApi(UpdateCommercialStatusBodySchema);
export const AdminLoginOpenApi = toOpenApi(AdminLoginSchema);
export const AdminRefreshOpenApi = toOpenApi(AdminRefreshSchema);
export const AdminAuthTokenResponseOpenApi = toOpenApi(AdminAuthTokenResponseSchema);
export const CreateAdminUserOpenApi = toOpenApi(CreateAdminUserBodySchema);
export const UpdateAdminUserOpenApi = toOpenApi(UpdateAdminUserBodySchema);
export const AdminUserRecordOpenApi = toOpenApi(AdminUserRecordSchema);
export const AdminUserListResponseOpenApi = toOpenApi(AdminUserListResponseSchema);
export const AdminUserDeleteResponseOpenApi = toOpenApi(AdminUserDeleteResponseSchema);
export const UpdateAdminUserStatusOpenApi = toOpenApi(UpdateAdminUserStatusBodySchema);
export const ChangeAdminPasswordOpenApi = toOpenApi(ChangeAdminPasswordSchema);
export const AdminEmailAvailabilityOpenApi = toOpenApi(AdminEmailAvailabilitySchema);
export const CreateAuditLogOpenApi = toOpenApi(CreateAuditLogBodySchema);
export const AuditLogRecordOpenApi = toOpenApi(AuditLogRecordSchema);
export const AuditLogListResponseOpenApi = toOpenApi(AuditLogListResponseSchema);
export const AuditLogSummaryOpenApi = toOpenApi(AuditLogSummarySchema);
export const SearchRequestOpenApi = toOpenApi(SearchRequestSchema);
export const SearchResultOpenApi = toOpenApi(SearchResultSchema);
export const BookingRequestOpenApi = toOpenApi(BookingRequestSchema);
export const BookingConfirmationOpenApi = toOpenApi(BookingConfirmationSchema);
export const CancellationResultOpenApi = toOpenApi(CancellationResultSchema);
export const HubCancelRequestOpenApi = toOpenApi(HubCancelRequestSchema);

export const CreateCorporateExample = BaseCorporateSchema.parse({
  companyName: 'Acme Corporation',
  corporateCode: 'ACME001',
  industry: 'Technology',
  companyType: 'B2B Corporate',
  status: 'ACTIVE',
});

export const UpdateCorporateExample = {
  companyName: 'Acme Corporation Pvt Ltd',
  industry: 'Software',
  creditAndBilling: {
    billingMode: 'Credit Limit',
    creditLimit: 2500000,
    paymentTerms: 'Net 30',
    gstNumber: '27ABCDE1234F1Z5',
    taxTreatment: 'Exclusive of Tax',
  },
};

export const UpdateCorporateStatusExample = {
  status: 'INACTIVE',
  reason: 'Contract expired',
};

export const CreateRoleExample = BaseRoleSchema.parse({
  name: 'Booking Manager',
  code: 'BOOKING_MANAGER',
  description: 'Manages bookings, ticketing operations and related processes.',
  roleType: 'INTERNAL',
  dataScope: 'GLOBAL',
  status: 'ACTIVE',
  makerCheckerRequired: false,
  grants: {
    'dashboard.view': { view: true, create: false, edit: false, delete: false },
    'bookings.view': { view: true, create: false, edit: false, delete: false },
    'bookings.create': { view: false, create: true, edit: false, delete: false },
    'bookings.edit': { view: false, create: false, edit: true, delete: false },
    'bookings.cancel': { view: false, create: false, edit: false, delete: true },
  },
});

export const UpdateRoleExample = {
  name: 'Booking Manager',
  description: 'Manages bookings, ticketing operations and related processes.',
  dataScope: 'CORPORATE',
  status: 'ACTIVE',
  makerCheckerRequired: true,
  grants: {
    'bookings.view': { view: true, create: false, edit: false, delete: false },
    'bookings.create': { view: false, create: true, edit: false, delete: false },
  },
};

export const UpdateRoleStatusExample = {
  status: 'INACTIVE',
  reason: 'Role deprecated',
};

export const CreatePermissionExample = {
  name: 'Approve Booking',
  code: 'bookings.approve',
  moduleCode: 'bookings',
  description: 'Allows approving booking workflows',
  status: 'ACTIVE',
};

export const UpdatePermissionExample = {
  name: 'Approve Booking',
  description: 'Updated approval permission',
  status: 'ACTIVE',
};

export const CreatePermissionModuleExample = {
  code: 'operations',
  name: 'Operations',
  sortOrder: 110,
  tone: 'blue',
  status: 'ACTIVE',
};

export const SearchRequestExample = {
  vertical: 'HOTEL',
  corporateId: 'ACME001',
  currency: 'INR',
  market: 'IN',
  destination: 'BOM',
  checkIn: '2026-11-10',
  checkOut: '2026-11-12',
  adults: 1,
  children: 0,
  rooms: 1,
};

export const BookingRequestExample = {
  vertical: 'HOTEL',
  corporateId: 'ACME001',
  userId: 'usr_123',
  offerId: 'off_456',
  supplierCode: 'MOCK',
  travellers: [
    {
      type: 'ADT',
      givenName: 'John',
      familyName: 'Mathew',
      email: 'john.mathew@acmecorp.com',
    },
  ],
  idempotencyKey: 'idem-create-booking-001',
  currency: 'INR',
};

export const HubCancelRequestExample = {
  supplierCode: 'MOCK',
  vertical: 'HOTEL',
  bookingRef: 'BK123456',
};

export const CreateTravelPolicyExample = {
  name: 'Standard Policy',
  code: 'POL001',
  policyType: 'STANDARD',
  description: 'Standard corporate travel policy for all employees.',
  applicableTo: 'ALL_EMPLOYEES',
  status: 'DRAFT',
  corporateId: 'corp_acme_default_01',
};

export const SaveTravelRulesStepExample = {
  travelRules: {
    flights: {
      classRestriction: 'ECONOMY_ONLY',
      preferredAirlines: ['Emirates', 'Qatar Airways', 'IndiGo'],
      restrictedAirlines: ['SpiceJet', 'Go First'],
      minAdvanceBookingDays: 7,
      maxAdvanceBookingDays: 90,
      routeRestriction: 'NONE',
      allowRefundableTickets: true,
      allowDateChange: true,
      allowOpenJaw: false,
      allowMultiCity: true,
      allowOnlyCorporateFares: true,
      allowPublicFares: false,
      autoApplyBestFare: true,
      requireApprovalForFareDifference: false,
      fareDifferenceThreshold: 200,
    },
    hotels: {
      maxStarRating: 4,
      preferredHotels: [],
      restrictedHotels: [],
      allowRefundableOnly: false,
      requireApprovalAboveLimit: true,
    },
    groundTransport: {
      vehicleClass: 'ECONOMY',
      allowRideShare: true,
      allowRentalCar: true,
    },
    trains: {
      allowed: true,
      maxClass: 'AC_3_TIER',
      preferredOperators: [],
    },
    otherServices: {
      allowVisaServices: true,
      allowTravelInsurance: true,
      allowAirportTransfers: true,
    },
  },
};

export const SaveSpendingLimitsStepExample = {
  spendingLimits: {
    currency: 'USD',
    flightPerTrip: 500,
    hotelPerNight: 150,
    groundTransportDaily: 50,
    mealsDaily: 30,
  },
};

export const SaveApprovalWorkflowStepExample = {
  approvalWorkflow: {
    steps: [
      { step: 1, role: 'EMPLOYEE', label: 'Employee (Self Approval)', required: true },
      { step: 2, role: 'MANAGER', label: 'Manager Approval', required: true },
      {
        step: 3,
        role: 'FINANCE',
        label: 'Finance Approval',
        required: false,
        conditionAmount: 1000,
        conditionCurrency: 'USD',
      },
    ],
    autoApproveWithinLimits: false,
  },
};

export const SaveAssignmentStepExample = {
  assignment: {
    departmentIds: [],
    costCenterIds: [],
    employeeIds: [],
    groupIds: [],
    totalEmployees: 8450,
    reviewed: true,
  },
  publish: true,
};

export const CreateCorporateCodeExample = {
  code: 'ACME001',
  name: 'Acme Corporation',
  corporateType: 'CLIENT',
  defaultCountry: 'India',
  defaultCurrency: 'INR',
  pricingModel: 'MARKUP',
  gstApplicable: true,
  status: 'ACTIVE',
  primaryContact: 'John Mathew',
  email: 'john.mathew@acmecorp.com',
  phone: '+91 9876543210',
  remarks: 'Primary corporate code for Acme travel bookings.',
};

export const UpdateCorporateCodeExample = {
  name: 'Acme Corporation Pvt Ltd',
  pricingModel: 'COMMISSION',
  gstApplicable: true,
  status: 'ACTIVE',
  remarks: 'Updated pricing model to commission.',
};

export const CreateMarkupRuleExample = {
  name: 'Domestic Flight Markup',
  productType: 'FLIGHT',
  markupType: 'PERCENTAGE',
  markupValue: 5,
  applicableTo: 'ALL_AGENTS',
  priority: 1,
  validFrom: '2026-01-01T00:00:00.000Z',
  validTo: '2026-12-31T00:00:00.000Z',
  status: 'ACTIVE',
  conditions: [{ field: 'routeType', operator: 'EQ', value: 'DOMESTIC' }],
  remarks: 'Standard domestic flight markup for all agents.',
};

export const UpdateMarkupRuleExample = {
  name: 'Domestic Flight Markup',
  markupValue: 7.5,
  priority: 2,
  status: 'ACTIVE',
  remarks: 'Increased domestic flight markup.',
};

export const CreateSupplierCommissionExample = {
  supplierName: 'TBO Holidays',
  productType: 'HOTEL',
  commissionType: 'PERCENTAGE',
  value: 10,
  validFrom: '2025-10-01T00:00:00.000Z',
  validTo: '2026-12-31T00:00:00.000Z',
  status: 'ACTIVE',
};

export const CreateServiceFeeExample = {
  feeName: 'Flight Service Fee',
  productType: 'FLIGHT',
  feeType: 'FIXED',
  value: 250,
  applicableTo: 'ALL_AGENTS',
  status: 'ACTIVE',
};

export const CreateConvenienceFeeExample = {
  feeName: 'Web Convenience Fee',
  productType: 'FLIGHT',
  channel: 'WEB',
  value: 75,
  applicableTo: 'ALL_AGENTS',
  status: 'ACTIVE',
};

export const CreateDiscountRuleExample = {
  name: 'Early Bird Discount',
  productType: 'FLIGHT',
  discountType: 'PERCENTAGE',
  value: 5,
  minBookingValue: 5000,
  validFrom: '2025-10-01T00:00:00.000Z',
  status: 'ACTIVE',
};

export const CreateGstRuleExample = {
  name: 'Domestic Flight GST',
  productType: 'FLIGHT',
  gstType: 'GST',
  gstPercentage: 5,
  applicableFor: 'DOMESTIC',
  status: 'ACTIVE',
};

export const AdminLoginExample = {
  email: 'admn@misbaholidays.com',
  password: 'Misba@2026',
};

export const CreateAdminUserExample = {
  email: 'admn@misbaholidays.com',
  password: 'Misba@2026',
  firstName: 'Super',
  lastName: 'Admin',
  displayName: 'Super Admin',
  phone: null,
  address: 'Mumbai',
  roleCode: 'SUPER_ADMIN',
  roleName: 'Super Admin',
  status: 'ACTIVE',
  mfaEnabled: false,
  mustChangePassword: false,
};

export const CreateAuditLogExample = {
  actorId: 'admin_super_01',
  actorType: 'ADMIN_USER',
  actorName: 'Misba Admin',
  actorEmail: 'admin@misba.com',
  action: 'LOGIN',
  resourceType: 'ADMIN_SESSION',
  resourceId: 'session_001',
  targetLabel: 'Admin Portal',
  result: 'SUCCESS',
  ip: '203.0.113.45',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0.0.0',
  metadata: { portal: 'supervision' },
};
