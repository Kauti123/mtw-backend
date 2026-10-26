import { z } from 'zod';

// ═══════════════════════════════════════════════════════════
// Sub-schemas matching form sections
// ═══════════════════════════════════════════════════════════

export const AdminUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').default('John'),
  lastName: z.string().min(1, 'Last name is required').default('Mathew'),
  workEmail: z.string().email('Valid work email is required').default('john.mathew@acmecorp.com'),
  phoneCountryCode: z.string().default('+91'),
  phoneNumber: z.string().min(5, 'Valid mobile number is required').default('9876543210'),
  employeeId: z.string().optional().default('EMP001'),
  designation: z.string().min(1, 'Designation is required').default('Travel Manager'),
  department: z.string().optional().default('Travel & Administration'),
  sendWelcomeEmail: z.boolean().default(true),
});

export const AdminAccessSchema = z.object({
  role: z.string().default('Corporate Admin'),
  loginMethod: z.enum(['EMAIL_OTP', 'EMPLOYEE_ID_OTP']).default('EMAIL_OTP'),
  mfaRequired: z.boolean().default(false),
  accountStatus: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const AccountConfigurationSchema = z.object({
  accountType: z.string().default('B2B Corporate'),
  currency: z.string().default('INR'),
  timezone: z.string().default('Asia/Kolkata (GMT +5:30)'),
  fiscalYear: z.string().default('April - March'),
  defaultLanguage: z.string().default('English'),
});

export const BookingSettingsSchema = z.object({
  flightBooking: z.boolean().default(true),
  hotelBooking: z.boolean().default(true),
  groundTransport: z.boolean().default(true),
  allowSelfBooking: z.boolean().default(true),
  allowGuestBooking: z.boolean().default(false),
  cancellationAllowed: z.boolean().default(true),
});

export const CreditAndBillingSchema = z
  .object({
    billingMode: z.string().default('Credit Limit'),
    billingModes: z.array(z.string()).optional().default([]),
    creditWallet: z.boolean().optional(),
    depositWallet: z.boolean().optional(),
    paymentGateway: z.boolean().optional(),
    creditLimit: z.number().nonnegative().default(1000000),
    paymentTerms: z.string().default('Net 30'),
    gstNumber: z.string().optional().default('27ABCDE1234F1Z5'),
    taxTreatment: z.string().default('Exclusive of Tax'),
  })
  .passthrough();

export const SecuritySettingsSchema = z.object({
  sessionTimeout: z.union([z.string(), z.number()]).default('60 minutes'),
  passwordPolicy: z.string().default('Standard (Min 8 characters)'),
  ipRestriction: z.boolean().default(false),
  allowedIpAddresses: z.array(z.string()).optional().default([]),
  enableLogging: z.boolean().default(true),
});

export const PolicySettingsSchema = z.object({
  defaultPolicy: z.string().default('Standard Corporate Policy'),
  flightPolicy: z.string().optional().default('Standard Flight Policy'),
  hotelPolicy: z.string().optional().default('Standard Hotel Policy'),
  groundTransportPolicy: z.string().optional().default('Standard Transport Policy'),
  internationalTravelPolicy: z.string().optional().default('International Travel Policy'),
});

export const ApprovalLevelsSchema = z.object({
  employee: z.boolean().default(true),
  reportingManager: z.boolean().default(true),
  travelAdmin: z.boolean().default(true),
  financeTeam: z.boolean().default(false),
});

export const ApprovalWorkflowSchema = z.object({
  levels: ApprovalLevelsSchema.default({
    employee: true,
    reportingManager: true,
    travelAdmin: true,
    financeTeam: false,
  }),
  approvalThreshold: z.number().nonnegative().default(50000),
  approvalForInternationalTravel: z.boolean().default(true),
});

export const SpendingLimitsSchema = z.object({
  flightPerTrip: z.number().nonnegative().default(50000),
  hotelPerNight: z.number().nonnegative().default(15000),
  groundTransportDaily: z.number().nonnegative().default(5000),
});

export const PolicyExceptionsSchema = z.object({
  allowPolicyException: z.boolean().default(true),
  approvalRequired: z.boolean().default(true),
  notifyAdmin: z.boolean().default(true),
});

// ═══════════════════════════════════════════════════════════
// Corporate Creation & Update DTO Schemas
// ═══════════════════════════════════════════════════════════

export function preprocessCorporatePayload(val: unknown) {
  if (!val || typeof val !== 'object') return val;
  const copy: Record<string, unknown> = { ...(val as Record<string, unknown>) };

  // Allow alias companyName <-> legalName
  if (!copy['companyName'] && copy['legalName']) {
    copy['companyName'] = copy['legalName'];
  }
  if (!copy['legalName'] && copy['companyName']) {
    copy['legalName'] = copy['companyName'];
  }
  // Allow alias corporateCode <-> code
  if (!copy['corporateCode'] && copy['code']) {
    copy['corporateCode'] = copy['code'];
  }
  if (!copy['code'] && copy['corporateCode']) {
    copy['code'] = copy['corporateCode'];
  }

  // Support flat primary admin fields
  if (!copy['primaryAdmin'] && (copy['firstName'] || copy['workEmail'])) {
    copy['primaryAdmin'] = {
      firstName: copy['firstName'] ?? 'John',
      lastName: copy['lastName'] ?? 'Mathew',
      workEmail: copy['workEmail'] ?? 'john.mathew@acmecorp.com',
      phoneCountryCode: copy['phoneCountryCode'] ?? '+91',
      phoneNumber: copy['phoneNumber'] ?? copy['mobileNumber'] ?? '9876543210',
      employeeId: copy['employeeId'] ?? 'EMP001',
      designation: copy['designation'] ?? 'Travel Manager',
      department: copy['department'] ?? 'Travel & Administration',
      sendWelcomeEmail: copy['sendWelcomeEmail'] ?? true,
    };
  }

  // Support flat admin access
  if (!copy['adminAccess'] && (copy['role'] || copy['loginMethod'])) {
    copy['adminAccess'] = {
      role: copy['role'] ?? 'Corporate Admin',
      loginMethod: copy['loginMethod'] ?? 'EMAIL_OTP',
      mfaRequired: copy['mfaRequired'] ?? false,
      accountStatus: copy['accountStatus'] ?? 'ACTIVE',
    };
  }

  // Support flat account configuration
  if (
    !copy['accountConfiguration'] &&
    (copy['currency'] || copy['timezone'] || copy['accountType'])
  ) {
    copy['accountConfiguration'] = {
      accountType: copy['accountType'] ?? copy['companyType'] ?? 'B2B Corporate',
      currency: copy['currency'] ?? copy['defaultCurrency'] ?? 'INR',
      timezone: copy['timezone'] ?? 'Asia/Kolkata (GMT +5:30)',
      fiscalYear: copy['fiscalYear'] ?? 'April - March',
      defaultLanguage: copy['defaultLanguage'] ?? 'English',
    };
  }

  // Support flat credit & billing
  if (!copy['creditAndBilling'] && (copy['billingMode'] || copy['creditLimit'] !== undefined)) {
    copy['creditAndBilling'] = {
      billingMode: copy['billingMode'] ?? 'Credit Limit',
      creditLimit: copy['creditLimit'] !== undefined ? Number(copy['creditLimit']) : 1000000,
      paymentTerms: copy['paymentTerms'] ?? 'Net 30',
      gstNumber: copy['gstNumber'] ?? '27ABCDE1234F1Z5',
      taxTreatment: copy['taxTreatment'] ?? 'Exclusive of Tax',
    };
  }

  return copy;
}

export const BaseCorporateSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  corporateCode: z
    .string()
    .min(2, 'Corporate code is required')
    .regex(/^[A-Za-z0-9_-]+$/, 'Corporate code must be alphanumeric'),
  industry: z.string().optional().default('Technology'),
  companyType: z.string().optional().default('B2B Corporate'),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),

  accountConfiguration: AccountConfigurationSchema.default({
    accountType: 'B2B Corporate',
    currency: 'INR',
    timezone: 'Asia/Kolkata (GMT +5:30)',
    fiscalYear: 'April - March',
    defaultLanguage: 'English',
  }),

  primaryAdmin: AdminUserSchema.default({
    firstName: 'John',
    lastName: 'Mathew',
    workEmail: 'john.mathew@acmecorp.com',
    phoneCountryCode: '+91',
    phoneNumber: '9876543210',
    employeeId: 'EMP001',
    designation: 'Travel Manager',
    department: 'Travel & Administration',
    sendWelcomeEmail: true,
  }),

  adminAccess: AdminAccessSchema.default({
    role: 'Corporate Admin',
    loginMethod: 'EMAIL_OTP',
    mfaRequired: false,
    accountStatus: 'ACTIVE',
  }),

  bookingSettings: BookingSettingsSchema.default({
    flightBooking: true,
    hotelBooking: true,
    groundTransport: true,
    allowSelfBooking: true,
    allowGuestBooking: false,
    cancellationAllowed: true,
  }),

  creditAndBilling: CreditAndBillingSchema.default({
    billingMode: 'Credit Limit',
    creditLimit: 1000000,
    paymentTerms: 'Net 30',
    gstNumber: '27ABCDE1234F1Z5',
    taxTreatment: 'Exclusive of Tax',
  }),

  securitySettings: SecuritySettingsSchema.default({
    sessionTimeout: '60 minutes',
    passwordPolicy: 'Standard (Min 8 characters)',
    ipRestriction: false,
    allowedIpAddresses: [],
    enableLogging: true,
  }),

  policySettings: PolicySettingsSchema.default({
    defaultPolicy: 'Standard Corporate Policy',
    flightPolicy: 'Standard Flight Policy',
    hotelPolicy: 'Standard Hotel Policy',
    groundTransportPolicy: 'Standard Transport Policy',
    internationalTravelPolicy: 'International Travel Policy',
  }),

  approvalWorkflow: ApprovalWorkflowSchema.default({
    levels: {
      employee: true,
      reportingManager: true,
      travelAdmin: true,
      financeTeam: false,
    },
    approvalThreshold: 50000,
    approvalForInternationalTravel: true,
  }),

  spendingLimits: SpendingLimitsSchema.default({
    flightPerTrip: 50000,
    hotelPerNight: 15000,
    groundTransportDaily: 5000,
  }),

  policyExceptions: PolicyExceptionsSchema.default({
    allowPolicyException: true,
    approvalRequired: true,
    notifyAdmin: true,
  }),
});

export const CreateCorporateSchema = z.preprocess(preprocessCorporatePayload, BaseCorporateSchema);

export const UpdateCorporateSchema = z.preprocess(
  preprocessCorporatePayload,
  BaseCorporateSchema.partial(),
);

export const CorporateQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  industry: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const UpdateCorporateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED']),
  reason: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════
// TypeScript Types
// ═══════════════════════════════════════════════════════════

export type AdminUser = z.infer<typeof AdminUserSchema>;
export type AdminAccess = z.infer<typeof AdminAccessSchema>;
export type AccountConfiguration = z.infer<typeof AccountConfigurationSchema>;
export type BookingSettings = z.infer<typeof BookingSettingsSchema>;
export type CreditAndBilling = z.infer<typeof CreditAndBillingSchema>;
export type SecuritySettings = z.infer<typeof SecuritySettingsSchema>;
export type PolicySettings = z.infer<typeof PolicySettingsSchema>;
export type ApprovalWorkflow = z.infer<typeof ApprovalWorkflowSchema>;
export type SpendingLimits = z.infer<typeof SpendingLimitsSchema>;
export type PolicyExceptions = z.infer<typeof PolicyExceptionsSchema>;

export type CreateCorporateDto = z.infer<typeof CreateCorporateSchema>;
export type UpdateCorporateDto = z.infer<typeof UpdateCorporateSchema>;
export type CorporateQueryDto = z.infer<typeof CorporateQuerySchema>;
export type UpdateCorporateStatusDto = z.infer<typeof UpdateCorporateStatusSchema>;

export interface CorporateRecord {
  id: string;
  code: string;
  legalName: string;
  companyName: string;
  corporateCode: string;
  industry: string;
  companyType: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  defaultCurrency: string;
  timezone: string;
  accountConfiguration: AccountConfiguration;
  primaryAdmin: AdminUser;
  adminAccess: AdminAccess;
  bookingSettings: BookingSettings;
  creditAndBilling: CreditAndBilling;
  securitySettings: SecuritySettings;
  policySettings: PolicySettings;
  approvalWorkflow: ApprovalWorkflow;
  spendingLimits: SpendingLimits;
  policyExceptions: PolicyExceptions;
  createdAt: string;
  updatedAt: string;
}

export interface CorporateListResponse {
  items: CorporateRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const CorporateRecordSchema = z.object({
  id: z.string(),
  code: z.string(),
  legalName: z.string(),
  companyName: z.string(),
  corporateCode: z.string(),
  industry: z.string(),
  companyType: z.string(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED']),
  defaultCurrency: z.string(),
  timezone: z.string(),
  accountConfiguration: AccountConfigurationSchema,
  primaryAdmin: AdminUserSchema,
  adminAccess: AdminAccessSchema,
  bookingSettings: BookingSettingsSchema,
  creditAndBilling: CreditAndBillingSchema,
  securitySettings: SecuritySettingsSchema,
  policySettings: PolicySettingsSchema,
  approvalWorkflow: ApprovalWorkflowSchema,
  spendingLimits: SpendingLimitsSchema,
  policyExceptions: PolicyExceptionsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CorporateListResponseSchema = z.object({
  items: z.array(CorporateRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const CorporateCodeAvailabilitySchema = z.object({
  code: z.string(),
  available: z.boolean(),
});

export const CorporateDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string(),
});
