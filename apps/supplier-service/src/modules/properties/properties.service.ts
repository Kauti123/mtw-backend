import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PropertiesRepository, RoomNumberClashError } from './properties.repository';
import type {
  CreatePropertyDto,
  CreateRoomTypeDto,
  CreateRatePlanDto,
  CreateRoomsDto,
  NightlyRateRecord,
  RatesQueryDto,
  PropertyListResponse,
  PropertyPhotoRecord,
  PropertyQueryDto,
  PropertyRecord,
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

@Injectable()
export class PropertiesService {
  constructor(private readonly repository: PropertiesRepository) {}

  health() {
    return { service: 'supplier-properties', status: 'ok' };
  }

  async create(input: CreatePropertyDto): Promise<PropertyRecord> {
    const code = input.code.trim().toUpperCase();
    const existing = await this.repository.findByCode(code);
    if (existing) {
      throw new ConflictException(`Property code '${code}' is already in use.`);
    }
    try {
      return await this.repository.create({ ...input, code });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Property code '${code}' is already in use.`);
      }
      throw error;
    }
  }

  async update(id: string, input: UpdatePropertyDto): Promise<PropertyRecord> {
    const record = await this.repository.update(id, input);
    if (!record) throw new NotFoundException('Property not found');
    return record;
  }

  async getById(id: string): Promise<PropertyRecord> {
    const record = await this.repository.findById(id);
    if (!record) throw new NotFoundException('Property not found');
    return record;
  }

  async list(query: PropertyQueryDto): Promise<PropertyListResponse> {
    return this.repository.findAll(query);
  }

  async listPhotos(propertyId: string): Promise<PropertyPhotoRecord[]> {
    await this.getById(propertyId);
    return this.repository.listPhotos(propertyId);
  }

  async addPhoto(propertyId: string, input: UploadPhotoDto): Promise<PropertyPhotoRecord> {
    await this.getById(propertyId);
    const count = (await this.repository.listPhotos(propertyId)).length;
    if (count >= 30) throw new BadRequestException('This property already has 30 photos');
    const bytes = Buffer.from(input.dataBase64, 'base64');
    if (!bytes.length) throw new BadRequestException('The image file is empty');
    if (bytes.length > 5 * 1024 * 1024) throw new BadRequestException('Each photo must be 5 MB or smaller');
    return this.repository.addPhoto(propertyId, input, bytes);
  }

  async removePhoto(propertyId: string, photoId: string): Promise<{ deleted: true }> {
    const removed = await this.repository.removePhoto(propertyId, photoId);
    if (!removed) throw new NotFoundException('Photo not found');
    return { deleted: true };
  }

  async listRoomTypes(propertyId: string): Promise<RoomTypeRecord[]> {
    await this.getById(propertyId);
    return this.repository.listRoomTypes(propertyId);
  }

  async createRoomType(propertyId: string, input: CreateRoomTypeDto): Promise<RoomTypeRecord> {
    await this.getById(propertyId);
    const code = input.code.trim().toUpperCase();
    const existing = await this.repository.findRoomTypeByCode(propertyId, code);
    if (existing) throw new ConflictException(`Room type code '${code}' is already in use.`);
    this.assertGuestLimits(input.maxAdults, input.maxChildren, input.maxGuests);
    try {
      return await this.repository.createRoomType(propertyId, { ...input, code });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Room type code '${code}' is already in use.`);
      }
      throw error;
    }
  }

  async updateRoomType(propertyId: string, roomTypeId: string, input: UpdateRoomTypeDto): Promise<RoomTypeRecord> {
    const current = await this.repository.findRoomType(propertyId, roomTypeId);
    if (!current) throw new NotFoundException('Room type not found');
    const code = input.code?.trim().toUpperCase();
    if (code && code !== current.code) {
      const existing = await this.repository.findRoomTypeByCode(propertyId, code);
      if (existing) throw new ConflictException(`Room type code '${code}' is already in use.`);
    }
    const maxAdults = input.maxAdults ?? current.maxAdults;
    const maxChildren = input.maxChildren ?? current.maxChildren;
    const maxGuests = input.maxGuests ?? current.maxGuests;
    this.assertGuestLimits(maxAdults, maxChildren, maxGuests);
    try {
      const updated = await this.repository.updateRoomType(propertyId, roomTypeId, { ...input, code });
      if (!updated) throw new NotFoundException('Room type not found');
      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Room type code '${code}' is already in use.`);
      }
      throw error;
    }
  }

  async listRooms(propertyId: string): Promise<RoomRecord[]> {
    await this.getById(propertyId);
    return this.repository.listRooms(propertyId);
  }

  async createRooms(propertyId: string, input: CreateRoomsDto): Promise<RoomRecord[]> {
    await this.getById(propertyId);
    const type = await this.repository.findRoomType(propertyId, input.roomTypeId);
    if (!type) throw new NotFoundException('Room type not found');
    const numbers =
      input.mode === 'single'
        ? [String(input.number ?? '').trim()]
        : Array.from({ length: Number(input.to) - Number(input.from) + 1 }, (_, index) => `${input.prefix}${Number(input.from) + index}`);
    try {
      return await this.repository.createRooms(propertyId, input.roomTypeId, input.floor, numbers);
    } catch (error) {
      if (error instanceof RoomNumberClashError) {
        throw new ConflictException(
          error.numbers.length === 1
            ? `Room ${error.numbers[0]} already exists. Nothing was added.`
            : `${error.numbers.length} of these room numbers already exist. Nothing was added.`,
        );
      }
      throw error;
    }
  }

  async listRatePlans(propertyId: string): Promise<RatePlanRecord[]> {
    await this.getById(propertyId);
    return this.repository.listRatePlans(propertyId);
  }

  async createRatePlan(propertyId: string, input: CreateRatePlanDto): Promise<RatePlanRecord> {
    await this.getById(propertyId);
    await this.assertRoomTypes(propertyId, input.roomTypeIds);
    const code = input.code.trim().toUpperCase();
    const existing = await this.repository.findRatePlanByCode(propertyId, code);
    if (existing) throw new ConflictException(`Rate plan code '${code}' is already in use.`);
    try {
      return await this.repository.createRatePlan(propertyId, { ...input, code });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Rate plan code '${code}' is already in use.`);
      }
      throw error;
    }
  }

  async updateRatePlan(propertyId: string, ratePlanId: string, input: UpdateRatePlanDto): Promise<RatePlanRecord> {
    const current = await this.repository.findRatePlan(propertyId, ratePlanId);
    if (!current) throw new NotFoundException('Rate plan not found');
    if (input.roomTypeIds) await this.assertRoomTypes(propertyId, input.roomTypeIds);
    const code = input.code?.trim().toUpperCase();
    if (code && code !== current.code) {
      const existing = await this.repository.findRatePlanByCode(propertyId, code);
      if (existing) throw new ConflictException(`Rate plan code '${code}' is already in use.`);
    }
    try {
      const updated = await this.repository.updateRatePlan(propertyId, ratePlanId, { ...input, code });
      if (!updated) throw new NotFoundException('Rate plan not found');
      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Rate plan code '${code}' is already in use.`);
      }
      throw error;
    }
  }

  async listNightlyRates(propertyId: string, query: RatesQueryDto): Promise<NightlyRateRecord[]> {
    await this.getById(propertyId);
    if (query.to < query.from) throw new BadRequestException('To must be on or after from');
    return this.repository.listNightlyRates(propertyId, query.from, query.to);
  }

  async updateNightlyRates(propertyId: string, input: UpdateRatesDto): Promise<{ updated: number }> {
    await this.getById(propertyId);
    const plan = await this.repository.findRatePlan(propertyId, input.ratePlanId);
    if (!plan) throw new NotFoundException('Rate plan not found');
    if (!plan.roomTypeIds.includes(input.roomTypeId)) {
      throw new BadRequestException('That rate plan is not sold for this room type');
    }
    const dates = this.datesInRange(input.from, input.to, input.weekdays);
    if (dates.length > 120) throw new BadRequestException('Update at most 120 nights at a time');
    if (!dates.length) throw new BadRequestException('None of those dates fall on the selected weekdays');
    const updated = await this.repository.applyNightlyRates(propertyId, input, dates);
    return { updated };
  }

  private datesInRange(from: string, to: string, weekdays: number[]) {
    const allowed = new Set(weekdays);
    const dates: string[] = [];
    const cursor = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    while (cursor.getTime() <= end.getTime()) {
      if (allowed.has(cursor.getUTCDay())) dates.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      if (dates.length > 121) break;
    }
    return dates;
  }

  private async assertRoomTypes(propertyId: string, roomTypeIds: string[]) {
    const types = await this.repository.listRoomTypes(propertyId);
    const known = new Set(types.map((type) => type.id));
    if (roomTypeIds.some((id) => !known.has(id))) {
      throw new BadRequestException('Choose room types from this property');
    }
  }

  async updateRoom(propertyId: string, roomId: string, input: UpdateRoomDto): Promise<RoomRecord> {
    const updated = await this.repository.updateRoom(propertyId, roomId, input);
    if (!updated) throw new NotFoundException('Room not found');
    return updated;
  }

  private assertGuestLimits(maxAdults: number, maxChildren: number, maxGuests: number) {
    if (maxGuests < maxAdults) {
      throw new BadRequestException('Max guests must be at least the number of adults');
    }
    if (maxGuests > maxAdults + maxChildren) {
      throw new BadRequestException('Max guests cannot be more than adults and children together');
    }
  }

  async readPhotoFile(propertyId: string, photoId: string) {
    const file = await this.repository.readPhotoFile(propertyId, photoId);
    if (!file) throw new NotFoundException('Photo not found');
    return file;
  }
}
