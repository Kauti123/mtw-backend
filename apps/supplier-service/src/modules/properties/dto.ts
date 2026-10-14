import { z } from 'zod';

export const PropertyStatuses = ['Draft', 'In review', 'Active', 'Changes needed', 'Off sale'] as const;
export const PropertyTypes = ['Hotel', 'Resort', 'Apartment', 'Villa', 'Guesthouse'] as const;

const time = z.string().regex(/^\d{2}:\d{2}$/, 'Use a time like 14:00');

export const CreatePropertySchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Code is required')
    .max(32)
    .regex(/^[A-Za-z0-9-]+$/, 'Code can use letters, numbers, and hyphens'),
  name: z.string().trim().min(1, 'Property name is required').max(160),
  type: z.enum(PropertyTypes).default('Hotel'),
  stars: z.number().int().min(0).max(5).nullable().optional(),
  status: z.enum(PropertyStatuses).default('Draft'),
  currency: z.string().trim().min(3).max(8).default('INR'),
  checkIn: time.default('14:00'),
  checkOut: time.default('12:00'),
  city: z.string().trim().min(1, 'City is required').max(128),
  region: z.string().trim().max(64).optional().default(''),
  country: z.string().trim().max(8).optional().default('IN'),
  address: z.string().trim().min(1, 'Street address is required').max(255),
  postalCode: z.string().trim().max(16).optional().default(''),
  latitude: z.string().trim().max(32).optional().default(''),
  longitude: z.string().trim().max(32).optional().default(''),
  email: z.string().trim().max(160).optional().default(''),
  phone: z.string().trim().max(32).optional().default(''),
  description: z.string().trim().max(4000).optional().default(''),
  amenities: z.array(z.string().trim().min(1).max(64)).max(40).optional().default([]),
});

export const UpdatePropertySchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  type: z.enum(PropertyTypes).optional(),
  stars: z.number().int().min(0).max(5).nullable().optional(),
  status: z.enum(PropertyStatuses).optional(),
  currency: z.string().trim().min(3).max(8).optional(),
  checkIn: time.optional(),
  checkOut: time.optional(),
  city: z.string().trim().min(1).max(128).optional(),
  region: z.string().trim().max(64).optional(),
  country: z.string().trim().max(8).optional(),
  address: z.string().trim().min(1).max(255).optional(),
  postalCode: z.string().trim().max(16).optional(),
  latitude: z.string().trim().max(32).optional(),
  longitude: z.string().trim().max(32).optional(),
  email: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(32).optional(),
  description: z.string().trim().max(4000).optional(),
  amenities: z.array(z.string().trim().min(1).max(64)).max(40).optional(),
  photos: z.number().int().min(0).optional(),
  roomTypeCount: z.number().int().min(0).optional(),
  roomCount: z.number().int().min(0).optional(),
  sellableCount: z.number().int().min(0).optional(),
});

export const PropertyQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(PropertyStatuses).optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreatePropertyDto = z.output<typeof CreatePropertySchema>;
export type UpdatePropertyDto = z.output<typeof UpdatePropertySchema>;
export type PropertyQueryDto = z.output<typeof PropertyQuerySchema>;

export type PropertyRecord = {
  id: string;
  code: string;
  name: string;
  type: string;
  stars: number;
  status: string;
  currency: string;
  checkIn: string;
  checkOut: string;
  city: string;
  region: string;
  country: string;
  address: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  email: string;
  phone: string;
  description: string;
  amenities: string[];
  photos: number;
  roomTypeCount: number;
  roomCount: number;
  sellableCount: number;
  updated: string;
  createdAt: string;
};

export const UploadPhotoSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  caption: z.string().trim().max(255).optional().default(''),
  dataBase64: z.string().min(1),
});

export type UploadPhotoDto = z.output<typeof UploadPhotoSchema>;

export type PropertyPhotoRecord = {
  id: string;
  propertyId: string;
  fileName: string;
  mimeType: string;
  caption: string;
  cover: boolean;
  sortOrder: number;
  createdAt: string;
};

export const BedTypes = ['King', 'Queen', 'Double', 'Twin', 'Single'] as const;
export const SmokingOptions = ['Non-smoking', 'Smoking'] as const;

const roomCode = z
  .string()
  .trim()
  .min(1, 'Code is required')
  .max(32)
  .regex(/^[A-Za-z0-9-]+$/, 'Code can use letters, numbers, and hyphens');

function checkGuestLimits(
  value: { maxAdults?: number; maxChildren?: number; maxGuests?: number },
  ctx: z.RefinementCtx,
) {
  if (value.maxAdults == null || value.maxChildren == null || value.maxGuests == null) return;
  if (value.maxGuests < value.maxAdults) {
    ctx.addIssue({
      code: 'custom',
      path: ['maxGuests'],
      message: 'Max guests must be at least the number of adults',
    });
  }
  if (value.maxGuests > value.maxAdults + value.maxChildren) {
    ctx.addIssue({
      code: 'custom',
      path: ['maxGuests'],
      message: 'Max guests cannot be more than adults and children together',
    });
  }
}

export const CreateRoomTypeSchema = z
  .object({
    code: roomCode,
    name: z.string().trim().min(1, 'Name is required').max(160),
    bed: z.enum(BedTypes),
    sizeSqm: z.number().int().min(1).max(2000).nullable().optional(),
    smoking: z.enum(SmokingOptions).default('Non-smoking'),
    maxAdults: z.number().int().min(1, 'Max adults is required').max(20),
    maxChildren: z.number().int().min(0).max(20).default(0),
    maxGuests: z.number().int().min(1, 'Max guests is required').max(40),
    description: z.string().trim().max(4000).optional().default(''),
    amenities: z.array(z.string().trim().min(1).max(64)).max(30).optional().default([]),
  })
  .superRefine(checkGuestLimits);

export const UpdateRoomTypeSchema = z
  .object({
    code: roomCode.optional(),
    name: z.string().trim().min(1, 'Name is required').max(160).optional(),
    bed: z.enum(BedTypes).optional(),
    sizeSqm: z.number().int().min(1).max(2000).nullable().optional(),
    smoking: z.enum(SmokingOptions).optional(),
    maxAdults: z.number().int().min(1).max(20).optional(),
    maxChildren: z.number().int().min(0).max(20).optional(),
    maxGuests: z.number().int().min(1).max(40).optional(),
    description: z.string().trim().max(4000).optional(),
    amenities: z.array(z.string().trim().min(1).max(64)).max(30).optional(),
  })
  .superRefine(checkGuestLimits);

export type CreateRoomTypeDto = z.output<typeof CreateRoomTypeSchema>;
export type UpdateRoomTypeDto = z.output<typeof UpdateRoomTypeSchema>;

export type RoomTypeRecord = {
  id: string;
  propertyId: string;
  code: string;
  name: string;
  bed: string;
  sizeSqm: number | null;
  smoking: string;
  maxAdults: number;
  maxChildren: number;
  maxGuests: number;
  description: string;
  amenities: string[];
  rooms: number;
  available: number;
  photo: string;
  updated: string;
};

export const RoomStatuses = ['Available', 'Out of order', 'Retired'] as const;

const roomNumber = z
  .string()
  .trim()
  .min(1, 'Room number is required')
  .max(32)
  .regex(/^[A-Za-z0-9-]+$/, 'Room numbers can use letters, numbers, and hyphens');

export const CreateRoomsSchema = z
  .object({
    roomTypeId: z.string().trim().min(1, 'Room type is required'),
    floor: z.string().trim().max(16).optional().default(''),
    mode: z.enum(['range', 'single']),
    from: z.number().int().min(1).max(99999).optional(),
    to: z.number().int().min(1).max(99999).optional(),
    prefix: z
      .string()
      .trim()
      .max(8)
      .regex(/^[A-Za-z0-9-]*$/, 'Prefix can use letters, numbers, and hyphens')
      .optional()
      .default(''),
    number: z.string().trim().max(32).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === 'single') {
      const parsed = roomNumber.safeParse(value.number ?? '');
      if (!parsed.success) {
        ctx.addIssue({ code: 'custom', path: ['number'], message: parsed.error.issues[0]?.message ?? 'Room number is required' });
      }
      return;
    }
    if (value.from == null || value.to == null) {
      ctx.addIssue({ code: 'custom', path: ['from'], message: 'From and to are required' });
      return;
    }
    if (value.to < value.from) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'To must be the same as or after from' });
    }
    if (value.to - value.from + 1 > 200) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'Add at most 200 rooms at a time' });
    }
  });

export const UpdateRoomSchema = z.object({
  status: z.enum(RoomStatuses).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CreateRoomsDto = z.output<typeof CreateRoomsSchema>;
export type UpdateRoomDto = z.output<typeof UpdateRoomSchema>;

export type RoomRecord = {
  id: string;
  propertyId: string;
  roomTypeId: string;
  number: string;
  floor: string;
  roomType: string;
  status: string;
  notes: string;
  updated: string;
};

export const MealPlans = ['Room only', 'Breakfast', 'Half board'] as const;
export const CancellationPolicies = ['Flexible — free until 72 h', 'Non-refundable'] as const;

const rateCode = z
  .string()
  .trim()
  .min(1, 'Code is required')
  .max(32)
  .regex(/^[A-Za-z0-9-]+$/, 'Code can use letters, numbers, and hyphens');

export const CreateRatePlanSchema = z.object({
  code: rateCode,
  name: z.string().trim().min(1, 'Name is required').max(160),
  meal: z.enum(MealPlans),
  policy: z.enum(CancellationPolicies),
  adultsIncluded: z.number().int().min(1, 'Adults included is required').max(20),
  description: z.string().trim().max(4000).optional().default(''),
  roomTypeIds: z.array(z.string().trim().min(1)).min(1, 'Choose at least one room type').max(30),
});

export const UpdateRatePlanSchema = z.object({
  code: rateCode.optional(),
  name: z.string().trim().min(1, 'Name is required').max(160).optional(),
  meal: z.enum(MealPlans).optional(),
  policy: z.enum(CancellationPolicies).optional(),
  adultsIncluded: z.number().int().min(1).max(20).optional(),
  description: z.string().trim().max(4000).optional(),
  roomTypeIds: z.array(z.string().trim().min(1)).min(1, 'Choose at least one room type').max(30).optional(),
});

export type CreateRatePlanDto = z.output<typeof CreateRatePlanSchema>;
export type UpdateRatePlanDto = z.output<typeof UpdateRatePlanSchema>;

export type RatePlanRecord = {
  id: string;
  propertyId: string;
  code: string;
  name: string;
  meal: string;
  policy: string;
  adultsIncluded: number;
  description: string;
  roomTypeIds: string[];
  soldFor: string[];
  updated: string;
};

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-10-13');
const money = z.number().int().min(0).max(10_000_000);
const stayNights = z.number().int().min(1).max(90);

export const RatesQuerySchema = z.object({
  from: isoDate,
  to: isoDate,
});

export const UpdateRatesSchema = z
  .object({
    ratePlanId: z.string().trim().min(1, 'Rate plan is required'),
    roomTypeId: z.string().trim().min(1, 'Room type is required'),
    from: isoDate,
    to: isoDate,
    weekdays: z.array(z.number().int().min(0).max(6)).min(1, 'Choose at least one weekday'),
    price: money.nullable().optional(),
    extraAdult: money.nullable().optional(),
    extraChild: money.nullable().optional(),
    minStay: stayNights.nullable().optional(),
    maxStay: stayNights.nullable().optional(),
    closed: z.boolean().optional(),
    closedToArrival: z.boolean().optional(),
    closedToDeparture: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.to < value.from) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: 'To must be on or after from' });
    }
    const changed = ['price', 'extraAdult', 'extraChild', 'minStay', 'maxStay', 'closed', 'closedToArrival', 'closedToDeparture'].some(
      (key) => value[key as keyof typeof value] !== undefined,
    );
    if (!changed) {
      ctx.addIssue({ code: 'custom', path: ['price'], message: 'Change at least one field' });
    }
  });

export type RatesQueryDto = z.output<typeof RatesQuerySchema>;
export type UpdateRatesDto = z.output<typeof UpdateRatesSchema>;

export type NightlyRateRecord = {
  id: string;
  propertyId: string;
  roomTypeId: string;
  ratePlanId: string;
  date: string;
  price: number | null;
  extraAdult: number | null;
  extraChild: number | null;
  minStay: number | null;
  maxStay: number | null;
  closed: boolean;
  closedToArrival: boolean;
  closedToDeparture: boolean;
};

export type PropertyListResponse = {
  items: PropertyRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
