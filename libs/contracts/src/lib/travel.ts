import { z } from 'zod';

export const VerticalSchema = z.enum(['HOTEL', 'FLIGHT', 'BUS', 'CAB', 'TRAIN']);
export type Vertical = z.infer<typeof VerticalSchema>;

export const MoneySchema = z.object({
  amount: z.number(),
  currency: z.string().length(3),
});

export const PriceBreakdownSchema = z.object({
  base: MoneySchema,
  taxes: MoneySchema,
  fees: MoneySchema,
  total: MoneySchema,
  currency: z.string().length(3),
});
export type PriceBreakdown = z.infer<typeof PriceBreakdownSchema>;

export const TravellerSchema = z.object({
  type: z.enum(['ADT', 'CHD', 'INF']),
  givenName: z.string().min(1),
  familyName: z.string().min(1),
  dateOfBirth: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});
export type Traveller = z.infer<typeof TravellerSchema>;

export const SupplierErrorCodeSchema = z.enum([
  'TIMEOUT',
  'AUTH',
  'RATE_LIMIT',
  'NO_AVAILABILITY',
  'PRICE_CHANGED',
  'VALIDATION',
  'SUPPLIER_DOWN',
  'UNKNOWN',
]);
export type SupplierErrorCode = z.infer<typeof SupplierErrorCodeSchema>;

export const SupplierErrorSchema = z.object({
  code: SupplierErrorCodeSchema,
  message: z.string(),
  supplierCode: z.string().optional(),
  retryable: z.boolean().default(false),
  raw: z.unknown().optional(),
});
export type SupplierError = z.infer<typeof SupplierErrorSchema>;

export const OfferSchema = z.object({
  offerId: z.string(),
  supplierCode: z.string(),
  vertical: VerticalSchema,
  price: PriceBreakdownSchema,
  rawRef: z.string(),
  expiresAt: z.string().datetime().optional(),
  attributes: z.record(z.unknown()).default({}),
});
export type Offer = z.infer<typeof OfferSchema>;

export const SearchRequestSchema = z.object({
  vertical: VerticalSchema,
  corporateId: z.string(),
  currency: z.string().length(3).default('INR'),
  market: z.string().length(2).default('IN'),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  destination: z.string().optional(),
  origin: z.string().optional(),
  adults: z.number().int().positive().default(1),
  children: z.number().int().nonnegative().default(0),
  rooms: z.number().int().positive().default(1),
  filters: z.record(z.unknown()).optional(),
});
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const SearchResultSchema = z.object({
  vertical: VerticalSchema,
  offers: z.array(OfferSchema),
  suppliersQueried: z.array(z.string()),
  partial: z.boolean().default(false),
  correlationId: z.string().optional(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const BookingRequestSchema = z.object({
  vertical: VerticalSchema,
  corporateId: z.string(),
  userId: z.string(),
  offerId: z.string(),
  supplierCode: z.string(),
  travellers: z.array(TravellerSchema).min(1),
  idempotencyKey: z.string().min(8),
  currency: z.string().length(3).default('INR'),
  metadata: z.record(z.unknown()).optional(),
});
export type BookingRequest = z.infer<typeof BookingRequestSchema>;

export const BookingConfirmationSchema = z.object({
  bookingRef: z.string(),
  supplierBookingRef: z.string(),
  supplierCode: z.string(),
  status: z.enum(['INITIATED', 'HELD', 'CONFIRMED', 'TICKETED', 'CANCELLED', 'MODIFIED', 'FAILED']),
  price: PriceBreakdownSchema,
  raw: z.unknown().optional(),
});
export type BookingConfirmation = z.infer<typeof BookingConfirmationSchema>;

export const CancellationResultSchema = z.object({
  bookingRef: z.string(),
  status: z.enum(['CANCELLED', 'FAILED']),
  refundAmount: MoneySchema.optional(),
  message: z.string().optional(),
});
export type CancellationResult = z.infer<typeof CancellationResultSchema>;

export const CancellationPolicySchema = z.object({
  refundable: z.boolean(),
  deadline: z.string().datetime().optional(),
  penalty: MoneySchema.optional(),
  description: z.string().optional(),
});
export type CancellationPolicy = z.infer<typeof CancellationPolicySchema>;

export const DomainEventSchema = z.object({
  eventType: z.string(),
  aggregateType: z.string(),
  aggregateId: z.string(),
  occurredAt: z.string().datetime(),
  payload: z.record(z.unknown()),
  correlationId: z.string().optional(),
});
export type DomainEvent = z.infer<typeof DomainEventSchema>;

export const HubCancelRequestSchema = z.object({
  supplierCode: z.string().min(1),
  vertical: VerticalSchema,
  bookingRef: z.string().min(1),
});
export type HubCancelRequest = z.infer<typeof HubCancelRequestSchema>;

export const DomainEvents = {
  BookingCreated: 'booking.created',
  BookingConfirmed: 'booking.confirmed',
  BookingCancelled: 'booking.cancelled',
  PaymentCaptured: 'payment.captured',
  PaymentRefunded: 'payment.refunded',
  ApprovalRequested: 'approval.requested',
  ApprovalApproved: 'approval.approved',
  ApprovalRejected: 'approval.rejected',
  SupplierHealthChanged: 'supplier.health.changed',
} as const;
