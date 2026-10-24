import { z } from 'zod';

const POLICY_CODE_PATTERN = /^[A-Z0-9_-]+$/;

export const PolicyStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']);
export const PolicyTypeSchema = z.enum(['STANDARD', 'CUSTOM', 'STRICT', 'FLEXIBLE']);
export const PolicyApplicableToSchema = z.enum([
  'ALL_EMPLOYEES',
  'SPECIFIC_DEPARTMENTS',
  'SPECIFIC_COST_CENTERS',
  'SPECIFIC_EMPLOYEES_GROUPS',
]);
export const PolicyWizardStepSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const APPLICABLE_TO_ALIASES: Record<string, z.infer<typeof PolicyApplicableToSchema>> = {
  ALL_EMPLOYEES: 'ALL_EMPLOYEES',
  SPECIFIC_DEPARTMENTS: 'SPECIFIC_DEPARTMENTS',
  SPECIFIC_COST_CENTERS: 'SPECIFIC_COST_CENTERS',
  SPECIFIC_EMPLOYEES_GROUPS: 'SPECIFIC_EMPLOYEES_GROUPS',
  'All Employees': 'ALL_EMPLOYEES',
  'Specific Departments': 'SPECIFIC_DEPARTMENTS',
  'Specific Cost Centers': 'SPECIFIC_COST_CENTERS',
  'Specific Employees/Groups': 'SPECIFIC_EMPLOYEES_GROUPS',
};

const STATUS_ALIASES: Record<string, z.infer<typeof PolicyStatusSchema>> = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  Draft: 'DRAFT',
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
};

const TYPE_ALIASES: Record<string, z.infer<typeof PolicyTypeSchema>> = {
  STANDARD: 'STANDARD',
  CUSTOM: 'CUSTOM',
  STRICT: 'STRICT',
  FLEXIBLE: 'FLEXIBLE',
  Standard: 'STANDARD',
  Custom: 'CUSTOM',
  Strict: 'STRICT',
  Flexible: 'FLEXIBLE',
};

function normalizeEnum(value: unknown, aliases: Record<string, string>): unknown {
  if (typeof value !== 'string') return value;
  return aliases[value] ?? aliases[value.toUpperCase()] ?? value;
}

function preprocessPolicyPayload(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const copy = { ...(input as Record<string, unknown>) };

  if (copy['policyName'] && !copy['name']) copy['name'] = copy['policyName'];
  if (copy['policyCode'] && !copy['code']) copy['code'] = copy['policyCode'];

  if (typeof copy['code'] === 'string') copy['code'] = copy['code'].trim().toUpperCase();
  if (typeof copy['name'] === 'string') copy['name'] = copy['name'].trim();
  if (typeof copy['description'] === 'string') {
    copy['description'] = copy['description'].trim();
  }

  if (copy['status'] !== undefined) {
    copy['status'] = normalizeEnum(copy['status'], STATUS_ALIASES);
  }
  if (copy['policyType'] !== undefined) {
    copy['policyType'] = normalizeEnum(copy['policyType'], TYPE_ALIASES);
  }
  if (copy['applicableTo'] !== undefined) {
    copy['applicableTo'] = normalizeEnum(copy['applicableTo'], APPLICABLE_TO_ALIASES);
  }

  return copy;
}

// ─── Step payloads ───────────────────────────────────────────

export const FlightClassRestrictionSchema = z.enum([
  'ECONOMY_ONLY',
  'ECONOMY_AND_PREMIUM',
  'ALL_CLASSES',
]);

export const RouteRestrictionSchema = z.enum(['NONE', 'ALLOW_SPECIFIC', 'RESTRICT_SPECIFIC']);

export const FlightRulesSchema = z.object({
  classRestriction: FlightClassRestrictionSchema.default('ECONOMY_ONLY'),
  preferredAirlines: z.array(z.string()).default([]),
  restrictedAirlines: z.array(z.string()).default([]),
  minAdvanceBookingDays: z.number().int().min(0).default(7),
  maxAdvanceBookingDays: z.number().int().min(0).default(90),
  routeRestriction: RouteRestrictionSchema.default('NONE'),
  allowedLocations: z.array(z.string()).default([]),
  restrictedLocations: z.array(z.string()).default([]),
  allowRefundableTickets: z.boolean().default(true),
  allowDateChange: z.boolean().default(true),
  allowOpenJaw: z.boolean().default(false),
  allowMultiCity: z.boolean().default(true),
  allowOnlyCorporateFares: z.boolean().default(true),
  allowPublicFares: z.boolean().default(false),
  autoApplyBestFare: z.boolean().default(true),
  requireApprovalForFareDifference: z.boolean().default(false),
  fareDifferenceThreshold: z.number().min(0).default(200),
});

export const HotelRulesSchema = z.object({
  maxStarRating: z.number().int().min(1).max(5).default(4),
  preferredHotels: z.array(z.string()).default([]),
  restrictedHotels: z.array(z.string()).default([]),
  allowRefundableOnly: z.boolean().default(false),
  requireApprovalAboveLimit: z.boolean().default(true),
});

export const GroundTransportRulesSchema = z.object({
  vehicleClass: z.enum(['ECONOMY', 'STANDARD', 'PREMIUM', 'ALL']).default('ECONOMY'),
  allowRideShare: z.boolean().default(true),
  allowRentalCar: z.boolean().default(true),
  maxDailyDistanceKm: z.number().min(0).optional(),
});

export const TrainRulesSchema = z.object({
  allowed: z.boolean().default(true),
  maxClass: z.enum(['SLEEPER', 'AC_CHAIR', 'AC_3_TIER', 'AC_2_TIER', 'FIRST']).default('AC_3_TIER'),
  preferredOperators: z.array(z.string()).default([]),
});

export const OtherServicesRulesSchema = z.object({
  allowVisaServices: z.boolean().default(true),
  allowTravelInsurance: z.boolean().default(true),
  allowAirportTransfers: z.boolean().default(true),
  notes: z.string().max(500).optional().default(''),
});

export const TravelRulesSchema = z.object({
  flights: FlightRulesSchema.default({}),
  hotels: HotelRulesSchema.default({}),
  groundTransport: GroundTransportRulesSchema.default({}),
  trains: TrainRulesSchema.default({}),
  otherServices: OtherServicesRulesSchema.default({}),
});

export const PolicySpendingLimitsSchema = z.object({
  currency: z.string().length(3).default('USD'),
  flightPerTrip: z.number().min(0).default(500),
  hotelPerNight: z.number().min(0).default(150),
  groundTransportDaily: z.number().min(0).default(50),
  mealsDaily: z.number().min(0).default(30),
});

export const ApprovalStepSchema = z.object({
  step: z.number().int().min(1),
  role: z.string().min(1).max(128),
  label: z.string().min(1).max(128),
  required: z.boolean().default(true),
  conditionAmount: z.number().min(0).optional().nullable(),
  conditionCurrency: z.string().length(3).optional().nullable(),
});

export const PolicyApprovalWorkflowSchema = z.object({
  steps: z
    .array(ApprovalStepSchema)
    .min(1)
    .default([
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
    ]),
  autoApproveWithinLimits: z.boolean().default(false),
});

export const PolicyAssignmentSchema = z.object({
  departmentIds: z.array(z.string()).default([]),
  costCenterIds: z.array(z.string()).default([]),
  employeeIds: z.array(z.string()).default([]),
  groupIds: z.array(z.string()).default([]),
  totalEmployees: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(500).optional().default(''),
  reviewed: z.boolean().default(false),
});

export const BasicInfoSchema = z.object({
  name: z.string().min(1).max(128),
  code: z
    .string()
    .min(1)
    .max(64)
    .regex(POLICY_CODE_PATTERN, 'Use uppercase letters, numbers, underscore or hyphen'),
  policyType: PolicyTypeSchema.default('STANDARD'),
  description: z.string().max(250).optional().default(''),
  applicableTo: PolicyApplicableToSchema.default('ALL_EMPLOYEES'),
  status: PolicyStatusSchema.default('DRAFT'),
  corporateId: z.string().max(64).optional().nullable(),
});

// ─── Create / update / step schemas ──────────────────────────

export const CreateTravelPolicySchema = z.preprocess(
  preprocessPolicyPayload,
  BasicInfoSchema.extend({
    travelRules: TravelRulesSchema.optional(),
    spendingLimits: PolicySpendingLimitsSchema.optional(),
    approvalWorkflow: PolicyApprovalWorkflowSchema.optional(),
    assignment: PolicyAssignmentSchema.optional(),
    createdBy: z.string().max(128).optional().nullable(),
  }),
);

export const UpdateTravelPolicySchema = z.preprocess(
  preprocessPolicyPayload,
  BasicInfoSchema.partial().extend({
    travelRules: TravelRulesSchema.partial().optional(),
    spendingLimits: PolicySpendingLimitsSchema.partial().optional(),
    approvalWorkflow: PolicyApprovalWorkflowSchema.partial().optional(),
    assignment: PolicyAssignmentSchema.partial().optional(),
    updatedBy: z.string().max(128).optional().nullable(),
  }),
);

export const SaveBasicInfoStepSchema = z.preprocess(
  preprocessPolicyPayload,
  BasicInfoSchema.extend({
    updatedBy: z.string().max(128).optional().nullable(),
  }),
);

export const SaveTravelRulesStepSchema = z.object({
  travelRules: TravelRulesSchema,
  updatedBy: z.string().max(128).optional().nullable(),
});

export const SaveSpendingLimitsStepSchema = z.object({
  spendingLimits: PolicySpendingLimitsSchema,
  updatedBy: z.string().max(128).optional().nullable(),
});

export const SaveApprovalWorkflowStepSchema = z.object({
  approvalWorkflow: PolicyApprovalWorkflowSchema,
  updatedBy: z.string().max(128).optional().nullable(),
});

export const SaveAssignmentStepSchema = z.object({
  assignment: PolicyAssignmentSchema,
  /** When true, marks policy ACTIVE after assign & review. */
  publish: z.boolean().optional().default(false),
  updatedBy: z.string().max(128).optional().nullable(),
});

export const TravelPolicyQuerySchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    const copy = { ...(input as Record<string, unknown>) };
    if (copy['status'] !== undefined) {
      copy['status'] = normalizeEnum(copy['status'], STATUS_ALIASES);
    }
    if (copy['policyType'] !== undefined) {
      copy['policyType'] = normalizeEnum(copy['policyType'], TYPE_ALIASES);
    }
    if (copy['applicableTo'] !== undefined) {
      copy['applicableTo'] = normalizeEnum(copy['applicableTo'], APPLICABLE_TO_ALIASES);
    }
    return copy;
  },
  z.object({
    search: z.string().optional(),
    status: PolicyStatusSchema.optional(),
    policyType: PolicyTypeSchema.optional(),
    applicableTo: PolicyApplicableToSchema.optional(),
    corporateId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
);

export const UpdateTravelPolicyStatusSchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    const copy = { ...(input as Record<string, unknown>) };
    if (copy['status'] !== undefined) {
      copy['status'] = normalizeEnum(copy['status'], STATUS_ALIASES);
    }
    return copy;
  },
  z.object({
    status: PolicyStatusSchema,
    reason: z.string().optional(),
    updatedBy: z.string().max(128).optional().nullable(),
  }),
);

export type CreateTravelPolicyDto = z.output<typeof BasicInfoSchema> & {
  travelRules?: z.output<typeof TravelRulesSchema>;
  spendingLimits?: z.output<typeof PolicySpendingLimitsSchema>;
  approvalWorkflow?: z.output<typeof PolicyApprovalWorkflowSchema>;
  assignment?: z.output<typeof PolicyAssignmentSchema>;
  createdBy?: string | null;
};

export type UpdateTravelPolicyDto = {
  name?: string;
  code?: string;
  policyType?: z.infer<typeof PolicyTypeSchema>;
  description?: string;
  applicableTo?: z.infer<typeof PolicyApplicableToSchema>;
  status?: z.infer<typeof PolicyStatusSchema>;
  corporateId?: string | null;
  travelRules?: Partial<z.output<typeof TravelRulesSchema>>;
  spendingLimits?: Partial<z.output<typeof PolicySpendingLimitsSchema>>;
  approvalWorkflow?: Partial<z.output<typeof PolicyApprovalWorkflowSchema>>;
  assignment?: Partial<z.output<typeof PolicyAssignmentSchema>>;
  updatedBy?: string | null;
};

export type SaveBasicInfoStepDto = z.output<typeof BasicInfoSchema> & {
  updatedBy?: string | null;
};
export type SaveTravelRulesStepDto = z.infer<typeof SaveTravelRulesStepSchema>;
export type SaveSpendingLimitsStepDto = z.infer<typeof SaveSpendingLimitsStepSchema>;
export type SaveApprovalWorkflowStepDto = z.infer<typeof SaveApprovalWorkflowStepSchema>;
export type SaveAssignmentStepDto = z.infer<typeof SaveAssignmentStepSchema>;
export type TravelPolicyQueryDto = {
  search?: string;
  status?: z.infer<typeof PolicyStatusSchema>;
  policyType?: z.infer<typeof PolicyTypeSchema>;
  applicableTo?: z.infer<typeof PolicyApplicableToSchema>;
  corporateId?: string;
  page: number;
  limit: number;
};
export type UpdateTravelPolicyStatusDto = {
  status: z.infer<typeof PolicyStatusSchema>;
  reason?: string;
  updatedBy?: string | null;
};

export interface TravelPolicyRecord {
  id: string;
  corporateId: string | null;
  name: string;
  code: string;
  policyType: z.infer<typeof PolicyTypeSchema>;
  description: string;
  applicableTo: z.infer<typeof PolicyApplicableToSchema>;
  status: z.infer<typeof PolicyStatusSchema>;
  currentStep: number;
  completedSteps: number[];
  travelRules: z.output<typeof TravelRulesSchema>;
  spendingLimits: z.output<typeof PolicySpendingLimitsSchema>;
  approvalWorkflow: z.output<typeof PolicyApprovalWorkflowSchema>;
  assignment: z.output<typeof PolicyAssignmentSchema>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TravelPolicyListResponse {
  items: TravelPolicyRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const TravelPolicyRecordSchema = z.object({
  id: z.string(),
  corporateId: z.string().nullable(),
  name: z.string(),
  code: z.string(),
  policyType: PolicyTypeSchema,
  description: z.string(),
  applicableTo: PolicyApplicableToSchema,
  status: PolicyStatusSchema,
  currentStep: z.number().int(),
  completedSteps: z.array(z.number().int()),
  travelRules: TravelRulesSchema,
  spendingLimits: PolicySpendingLimitsSchema,
  approvalWorkflow: PolicyApprovalWorkflowSchema,
  assignment: PolicyAssignmentSchema,
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TravelPolicyListResponseSchema = z.object({
  items: z.array(TravelPolicyRecordSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const TravelPolicyCodeAvailabilitySchema = z.object({
  code: z.string(),
  available: z.boolean(),
});

export const TravelPolicyDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string(),
});

export function defaultTravelRules(): z.output<typeof TravelRulesSchema> {
  return TravelRulesSchema.parse({});
}

export function defaultSpendingLimits(): z.output<typeof PolicySpendingLimitsSchema> {
  return PolicySpendingLimitsSchema.parse({});
}

export function defaultApprovalWorkflow(): z.output<typeof PolicyApprovalWorkflowSchema> {
  return PolicyApprovalWorkflowSchema.parse({});
}

export function defaultAssignment(): z.output<typeof PolicyAssignmentSchema> {
  return PolicyAssignmentSchema.parse({});
}

export function markStepCompleted(completedSteps: number[], step: number): number[] {
  return Array.from(new Set([...completedSteps, step])).sort((a, b) => a - b);
}
