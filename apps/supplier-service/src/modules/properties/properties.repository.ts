import { Injectable, Optional, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@mtw/database';
import type {
  CreatePropertyDto,
  CreateRoomTypeDto,
  PropertyPhotoRecord,
  PropertyQueryDto,
  PropertyRecord,
  CreateRatePlanDto,
  NightlyRateRecord,
  RatePlanRecord,
  RoomRecord,
  RoomTypeRecord,
  UpdatePropertyDto,
  UpdateRatePlanDto,
  UpdateRatesDto,
  UpdateRoomDto,
  UpdateRoomTypeDto,
  UploadPhotoDto,
} from './dto';

export class RoomNumberClashError extends Error {
  constructor(readonly numbers: string[]) {
    super('Room numbers already exist');
  }
}

const ratePlanInclude = {
  roomTypes: { include: { roomType: { select: { id: true, name: true } } } },
} satisfies Prisma.SupplierRatePlanInclude;

type PropertyRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  stars: number | null;
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
  amenities: Prisma.JsonValue | null;
  photoCount: number;
  roomTypeCount: number;
  roomCount: number;
  sellableCount: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PropertiesRepository {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  private db() {
    if (!this.prisma) {
      throw new ServiceUnavailableException('Database is not available');
    }
    return this.prisma;
  }

  async create(input: CreatePropertyDto & { code: string }): Promise<PropertyRecord> {
    const row = await this.db().supplierProperty.create({
      data: {
        code: input.code,
        name: input.name,
        type: input.type,
        stars: input.stars && input.stars > 0 ? input.stars : null,
        status: input.status,
        currency: input.currency.toUpperCase(),
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        city: input.city,
        region: input.region,
        country: input.country.toUpperCase(),
        address: input.address,
        postalCode: input.postalCode,
        latitude: input.latitude,
        longitude: input.longitude,
        email: input.email,
        phone: input.phone,
        description: input.description,
        amenities: input.amenities,
      },
    });
    return this.map(row);
  }

  async update(id: string, input: UpdatePropertyDto): Promise<PropertyRecord | null> {
    const existing = await this.db().supplierProperty.findUnique({ where: { id } });
    if (!existing) return null;
    const row = await this.db().supplierProperty.update({
      where: { id },
      data: {
        name: input.name,
        type: input.type,
        stars: input.stars === undefined ? undefined : input.stars && input.stars > 0 ? input.stars : null,
        status: input.status,
        currency: input.currency?.toUpperCase(),
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        city: input.city,
        region: input.region,
        country: input.country?.toUpperCase(),
        address: input.address,
        postalCode: input.postalCode,
        latitude: input.latitude,
        longitude: input.longitude,
        email: input.email,
        phone: input.phone,
        description: input.description,
        amenities: input.amenities,
        photoCount: input.photos,
        roomTypeCount: input.roomTypeCount,
        roomCount: input.roomCount,
        sellableCount: input.sellableCount,
      },
    });
    return this.map(row);
  }

  async findByCode(code: string): Promise<PropertyRecord | null> {
    const row = await this.db().supplierProperty.findUnique({ where: { code } });
    return row ? this.map(row) : null;
  }

  async findById(id: string): Promise<PropertyRecord | null> {
    const row = await this.db().supplierProperty.findUnique({ where: { id } });
    return row ? this.map(row) : null;
  }

  async findAll(query: PropertyQueryDto): Promise<{
    items: PropertyRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where = this.where(query);
    const [rows, total] = await Promise.all([
      this.db().supplierProperty.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.db().supplierProperty.count({ where }),
    ]);
    return {
      items: rows.map((row) => this.map(row)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    };
  }

  private where(query: PropertyQueryDto): Prisma.SupplierPropertyWhereInput {
    const search = query.search?.trim();
    return {
      status: query.status,
      type: query.type || undefined,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { code: { contains: search } },
              { city: { contains: search } },
            ],
          }
        : {}),
    };
  }

  async listPhotos(propertyId: string): Promise<PropertyPhotoRecord[]> {
    const rows = await this.db().supplierPropertyPhoto.findMany({
      where: { propertyId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        propertyId: true,
        fileName: true,
        mimeType: true,
        caption: true,
        cover: true,
        sortOrder: true,
        createdAt: true,
      },
    });
    return rows.map((row) => this.mapPhoto(row));
  }

  async addPhoto(propertyId: string, input: UploadPhotoDto, bytes: Buffer): Promise<PropertyPhotoRecord> {
    const existing = await this.db().supplierPropertyPhoto.count({ where: { propertyId } });
    const row = await this.db().supplierPropertyPhoto.create({
      data: {
        propertyId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        caption: input.caption,
        cover: existing === 0,
        sortOrder: existing,
        bytes: Uint8Array.from(bytes),
      },
      select: {
        id: true,
        propertyId: true,
        fileName: true,
        mimeType: true,
        caption: true,
        cover: true,
        sortOrder: true,
        createdAt: true,
      },
    });
    await this.db().supplierProperty.update({
      where: { id: propertyId },
      data: { photoCount: existing + 1 },
    });
    return this.mapPhoto(row);
  }

  async removePhoto(propertyId: string, photoId: string): Promise<boolean> {
    const photo = await this.db().supplierPropertyPhoto.findFirst({
      where: { id: photoId, propertyId },
      select: { id: true, cover: true },
    });
    if (!photo) return false;
    await this.db().supplierPropertyPhoto.delete({ where: { id: photoId } });
    if (photo.cover) {
      const next = await this.db().supplierPropertyPhoto.findFirst({
        where: { propertyId },
        orderBy: { sortOrder: 'asc' },
        select: { id: true },
      });
      if (next) {
        await this.db().supplierPropertyPhoto.update({ where: { id: next.id }, data: { cover: true } });
      }
    }
    const count = await this.db().supplierPropertyPhoto.count({ where: { propertyId } });
    await this.db().supplierProperty.update({ where: { id: propertyId }, data: { photoCount: count } });
    return true;
  }

  async listRoomTypes(propertyId: string): Promise<RoomTypeRecord[]> {
    const rows = await this.db().supplierRoomType.findMany({
      where: { propertyId },
      orderBy: [{ name: 'asc' }],
    });
    return rows.map((row) => this.mapRoomType(row));
  }

  async findRoomType(propertyId: string, roomTypeId: string): Promise<RoomTypeRecord | null> {
    const row = await this.db().supplierRoomType.findFirst({ where: { id: roomTypeId, propertyId } });
    return row ? this.mapRoomType(row) : null;
  }

  async findRoomTypeByCode(propertyId: string, code: string): Promise<RoomTypeRecord | null> {
    const row = await this.db().supplierRoomType.findUnique({
      where: { propertyId_code: { propertyId, code } },
    });
    return row ? this.mapRoomType(row) : null;
  }

  async createRoomType(propertyId: string, input: CreateRoomTypeDto & { code: string }): Promise<RoomTypeRecord> {
    const row = await this.db().supplierRoomType.create({
      data: {
        propertyId,
        code: input.code,
        name: input.name,
        bed: input.bed,
        sizeSqm: input.sizeSqm ?? null,
        smoking: input.smoking,
        maxAdults: input.maxAdults,
        maxChildren: input.maxChildren,
        maxGuests: input.maxGuests,
        description: input.description,
        amenities: input.amenities,
      },
    });
    const count = await this.db().supplierRoomType.count({ where: { propertyId } });
    await this.db().supplierProperty.update({ where: { id: propertyId }, data: { roomTypeCount: count } });
    return this.mapRoomType(row);
  }

  async updateRoomType(
    propertyId: string,
    roomTypeId: string,
    input: UpdateRoomTypeDto & { code?: string },
  ): Promise<RoomTypeRecord | null> {
    const existing = await this.db().supplierRoomType.findFirst({ where: { id: roomTypeId, propertyId } });
    if (!existing) return null;
    const row = await this.db().supplierRoomType.update({
      where: { id: roomTypeId },
      data: {
        code: input.code,
        name: input.name,
        bed: input.bed,
        sizeSqm: input.sizeSqm,
        smoking: input.smoking,
        maxAdults: input.maxAdults,
        maxChildren: input.maxChildren,
        maxGuests: input.maxGuests,
        description: input.description,
        amenities: input.amenities,
      },
    });
    return this.mapRoomType(row);
  }

  async listRooms(propertyId: string): Promise<RoomRecord[]> {
    const rows = await this.db().supplierRoom.findMany({
      where: { propertyId },
      include: { roomType: { select: { name: true } } },
    });
    return rows.map((row) => this.mapRoom(row)).sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
  }

  async createRooms(propertyId: string, roomTypeId: string, floor: string, numbers: string[]): Promise<RoomRecord[]> {
    return this.db().$transaction(async (tx) => {
      const clashes = await tx.supplierRoom.findMany({
        where: { propertyId, number: { in: numbers } },
        select: { number: true },
      });
      if (clashes.length) throw new RoomNumberClashError(clashes.map((row) => row.number));
      await tx.supplierRoom.createMany({
        data: numbers.map((number) => ({
          propertyId,
          roomTypeId,
          number,
          floor,
          status: 'Available',
          notes: '',
        })),
      });
      await this.recountRooms(tx, propertyId);
      const rows = await tx.supplierRoom.findMany({
        where: { propertyId, number: { in: numbers } },
        include: { roomType: { select: { name: true } } },
      });
      return rows.map((row) => this.mapRoom(row)).sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
    });
  }

  async updateRoom(propertyId: string, roomId: string, input: UpdateRoomDto): Promise<RoomRecord | null> {
    return this.db().$transaction(async (tx) => {
      const existing = await tx.supplierRoom.findFirst({ where: { id: roomId, propertyId }, select: { id: true } });
      if (!existing) return null;
      const row = await tx.supplierRoom.update({
        where: { id: roomId },
        data: { status: input.status, notes: input.notes },
        include: { roomType: { select: { name: true } } },
      });
      await this.recountRooms(tx, propertyId);
      return this.mapRoom(row);
    });
  }

  async listRatePlans(propertyId: string): Promise<RatePlanRecord[]> {
    const rows = await this.db().supplierRatePlan.findMany({
      where: { propertyId },
      include: ratePlanInclude,
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.mapRatePlan(row));
  }

  async findRatePlanByCode(propertyId: string, code: string): Promise<RatePlanRecord | null> {
    const row = await this.db().supplierRatePlan.findUnique({
      where: { propertyId_code: { propertyId, code } },
      include: ratePlanInclude,
    });
    return row ? this.mapRatePlan(row) : null;
  }

  async findRatePlan(propertyId: string, ratePlanId: string): Promise<RatePlanRecord | null> {
    const row = await this.db().supplierRatePlan.findFirst({
      where: { id: ratePlanId, propertyId },
      include: ratePlanInclude,
    });
    return row ? this.mapRatePlan(row) : null;
  }

  async createRatePlan(propertyId: string, input: CreateRatePlanDto & { code: string }): Promise<RatePlanRecord> {
    const row = await this.db().supplierRatePlan.create({
      data: {
        propertyId,
        code: input.code,
        name: input.name,
        meal: input.meal,
        policy: input.policy,
        adultsIncluded: input.adultsIncluded,
        description: input.description,
        roomTypes: { create: input.roomTypeIds.map((roomTypeId) => ({ roomTypeId })) },
      },
      include: ratePlanInclude,
    });
    return this.mapRatePlan(row);
  }

  async updateRatePlan(
    propertyId: string,
    ratePlanId: string,
    input: UpdateRatePlanDto & { code?: string },
  ): Promise<RatePlanRecord | null> {
    const existing = await this.db().supplierRatePlan.findFirst({ where: { id: ratePlanId, propertyId }, select: { id: true } });
    if (!existing) return null;
    const row = await this.db().supplierRatePlan.update({
      where: { id: ratePlanId },
      data: {
        code: input.code,
        name: input.name,
        meal: input.meal,
        policy: input.policy,
        adultsIncluded: input.adultsIncluded,
        description: input.description,
        ...(input.roomTypeIds
          ? {
              roomTypes: {
                deleteMany: {},
                create: input.roomTypeIds.map((roomTypeId) => ({ roomTypeId })),
              },
            }
          : {}),
      },
      include: ratePlanInclude,
    });
    return this.mapRatePlan(row);
  }

  async listNightlyRates(propertyId: string, from: string, to: string): Promise<NightlyRateRecord[]> {
    const rows = await this.db().supplierNightlyRate.findMany({
      where: {
        propertyId,
        stayDate: { gte: this.stayDate(from), lte: this.stayDate(to) },
      },
      orderBy: { stayDate: 'asc' },
    });
    return rows.map((row) => this.mapNightlyRate(row));
  }

  async applyNightlyRates(
    propertyId: string,
    input: UpdateRatesDto,
    dates: string[],
  ): Promise<number> {
    const createValues = {
      price: input.price ?? null,
      extraAdult: input.extraAdult ?? null,
      extraChild: input.extraChild ?? null,
      minStay: input.minStay ?? null,
      maxStay: input.maxStay ?? null,
      closed: input.closed ?? false,
      closedToArrival: input.closedToArrival ?? false,
      closedToDeparture: input.closedToDeparture ?? false,
    };
    const patch: Prisma.SupplierNightlyRateUpdateInput = { ...createValues };
    await this.db().$transaction(async (tx) => {
      for (const date of dates) {
        const stayDate = this.stayDate(date);
        await tx.supplierNightlyRate.upsert({
          where: {
            ratePlanId_roomTypeId_stayDate: {
              ratePlanId: input.ratePlanId,
              roomTypeId: input.roomTypeId,
              stayDate,
            },
          },
          create: {
            propertyId,
            roomTypeId: input.roomTypeId,
            ratePlanId: input.ratePlanId,
            stayDate,
            ...createValues,
          },
          update: patch,
        });
      }
    });
    return dates.length;
  }

  private stayDate(iso: string) {
    return new Date(`${iso}T00:00:00.000Z`);
  }

  private mapNightlyRate(row: {
    id: string;
    propertyId: string;
    roomTypeId: string;
    ratePlanId: string;
    stayDate: Date;
    price: number | null;
    extraAdult: number | null;
    extraChild: number | null;
    minStay: number | null;
    maxStay: number | null;
    closed: boolean;
    closedToArrival: boolean;
    closedToDeparture: boolean;
  }): NightlyRateRecord {
    return {
      id: row.id,
      propertyId: row.propertyId,
      roomTypeId: row.roomTypeId,
      ratePlanId: row.ratePlanId,
      date: row.stayDate.toISOString().slice(0, 10),
      price: row.price,
      extraAdult: row.extraAdult,
      extraChild: row.extraChild,
      minStay: row.minStay,
      maxStay: row.maxStay,
      closed: row.closed,
      closedToArrival: row.closedToArrival,
      closedToDeparture: row.closedToDeparture,
    };
  }

  private mapRatePlan(row: {
    id: string;
    propertyId: string;
    code: string;
    name: string;
    meal: string;
    policy: string;
    adultsIncluded: number;
    description: string;
    updatedAt: Date;
    roomTypes: Array<{ roomTypeId: string; roomType: { name: string } }>;
  }): RatePlanRecord {
    const links = [...row.roomTypes].sort((a, b) => a.roomType.name.localeCompare(b.roomType.name));
    return {
      id: row.id,
      propertyId: row.propertyId,
      code: row.code,
      name: row.name,
      meal: row.meal,
      policy: row.policy,
      adultsIncluded: row.adultsIncluded,
      description: row.description,
      roomTypeIds: links.map((link) => link.roomTypeId),
      soldFor: links.map((link) => link.roomType.name),
      updated: row.updatedAt.toISOString(),
    };
  }

  private async recountRooms(tx: Prisma.TransactionClient, propertyId: string) {
    const [types, rooms] = await Promise.all([
      tx.supplierRoomType.findMany({ where: { propertyId }, select: { id: true } }),
      tx.supplierRoom.findMany({ where: { propertyId }, select: { roomTypeId: true, status: true } }),
    ]);
    for (const type of types) {
      const mine = rooms.filter((room) => room.roomTypeId === type.id);
      await tx.supplierRoomType.update({
        where: { id: type.id },
        data: {
          roomCount: mine.length,
          availableCount: mine.filter((room) => room.status === 'Available').length,
        },
      });
    }
    await tx.supplierProperty.update({
      where: { id: propertyId },
      data: {
        roomCount: rooms.length,
        sellableCount: rooms.filter((room) => room.status === 'Available').length,
      },
    });
  }

  async readPhotoFile(propertyId: string, photoId: string): Promise<{ mimeType: string; fileName: string; bytes: Buffer } | null> {
    const row = await this.db().supplierPropertyPhoto.findFirst({
      where: { id: photoId, propertyId },
      select: { mimeType: true, fileName: true, bytes: true },
    });
    if (!row) return null;
    return { mimeType: row.mimeType, fileName: row.fileName, bytes: Buffer.from(row.bytes) };
  }

  private mapRoom(row: {
    id: string;
    propertyId: string;
    roomTypeId: string;
    number: string;
    floor: string;
    status: string;
    notes: string;
    updatedAt: Date;
    roomType: { name: string };
  }): RoomRecord {
    return {
      id: row.id,
      propertyId: row.propertyId,
      roomTypeId: row.roomTypeId,
      number: row.number,
      floor: row.floor,
      roomType: row.roomType.name,
      status: row.status,
      notes: row.notes,
      updated: row.updatedAt.toISOString(),
    };
  }

  private mapRoomType(row: {
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
    amenities: Prisma.JsonValue | null;
    roomCount: number;
    availableCount: number;
    photoUrl: string;
    updatedAt: Date;
  }): RoomTypeRecord {
    const amenities = Array.isArray(row.amenities)
      ? row.amenities.filter((item): item is string => typeof item === 'string')
      : [];
    return {
      id: row.id,
      propertyId: row.propertyId,
      code: row.code,
      name: row.name,
      bed: row.bed,
      sizeSqm: row.sizeSqm,
      smoking: row.smoking,
      maxAdults: row.maxAdults,
      maxChildren: row.maxChildren,
      maxGuests: row.maxGuests,
      description: row.description,
      amenities,
      rooms: row.roomCount,
      available: row.availableCount,
      photo: row.photoUrl,
      updated: row.updatedAt.toISOString(),
    };
  }

  private mapPhoto(row: {
    id: string;
    propertyId: string;
    fileName: string;
    mimeType: string;
    caption: string;
    cover: boolean;
    sortOrder: number;
    createdAt: Date;
  }): PropertyPhotoRecord {
    return {
      id: row.id,
      propertyId: row.propertyId,
      fileName: row.fileName,
      mimeType: row.mimeType,
      caption: row.caption,
      cover: row.cover,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private map(row: PropertyRow): PropertyRecord {
    const amenities = Array.isArray(row.amenities)
      ? row.amenities.filter((item): item is string => typeof item === 'string')
      : [];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      stars: row.stars ?? 0,
      status: row.status,
      currency: row.currency,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      city: row.city,
      region: row.region,
      country: row.country,
      address: row.address,
      postalCode: row.postalCode,
      latitude: row.latitude,
      longitude: row.longitude,
      email: row.email,
      phone: row.phone,
      description: row.description,
      amenities,
      photos: row.photoCount,
      roomTypeCount: row.roomTypeCount,
      roomCount: row.roomCount,
      sellableCount: row.sellableCount,
      updated: row.updatedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
