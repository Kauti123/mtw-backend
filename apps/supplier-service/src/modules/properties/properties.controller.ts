import { Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, SkipApiResponseWrap } from '@mtw/common';
import { PropertiesService } from './properties.service';
import {
  CreatePropertySchema,
  CreateRatePlanSchema,
  CreateRoomsSchema,
  RatesQuerySchema,
  CreateRoomTypeSchema,
  PropertyQuerySchema,
  UpdatePropertySchema,
  UpdateRatePlanSchema,
  UpdateRatesSchema,
  UpdateRoomSchema,
  UpdateRoomTypeSchema,
  UploadPhotoSchema,
  type PropertyListResponse,
  type PropertyPhotoRecord,
  type NightlyRateRecord,
  type PropertyRecord,
  type RatePlanRecord,
  type RoomRecord,
  type RoomTypeRecord,
} from './dto';

@ApiTags('supplier-properties')
@Public()
@Controller('supplier-properties')
export class PropertiesController {
  constructor(private readonly service: PropertiesService) {}

  @Get('health')
  @ApiOperation({ summary: 'Supplier property module health probe' })
  @ApiOkResponse({ description: 'Module is healthy' })
  health() {
    return this.service.health();
  }

  @Get()
  @ApiOperation({ summary: 'List supplier properties' })
  @ApiOkResponse({ description: 'Paginated property list' })
  list(@Query() query: unknown): Promise<PropertyListResponse> {
    return this.service.list(PropertyQuerySchema.parse(query ?? {}));
  }

  @Get(':id/photos')
  @ApiOperation({ summary: 'List photos for a property' })
  listPhotos(@Param('id') id: string): Promise<PropertyPhotoRecord[]> {
    return this.service.listPhotos(id);
  }

  @Get(':id/photos/:photoId/file')
  @SkipApiResponseWrap()
  @ApiOperation({ summary: 'Download one property photo' })
  async file(@Param('id') id: string, @Param('photoId') photoId: string): Promise<StreamableFile> {
    const file = await this.service.readPhotoFile(id, photoId);
    return new StreamableFile(file.bytes, {
      type: file.mimeType,
      disposition: `inline; filename="${file.fileName.replace(/"/g, '')}"`,
    });
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Upload a property photo' })
  @ApiCreatedResponse({ description: 'Photo stored' })
  addPhoto(@Param('id') id: string, @Body() body: unknown): Promise<PropertyPhotoRecord> {
    return this.service.addPhoto(id, UploadPhotoSchema.parse(body));
  }

  @Delete(':id/photos/:photoId')
  @ApiOperation({ summary: 'Remove a property photo' })
  removePhoto(@Param('id') id: string, @Param('photoId') photoId: string) {
    return this.service.removePhoto(id, photoId);
  }

  @Get(':id/room-types')
  @ApiOperation({ summary: 'List room types for a property' })
  listRoomTypes(@Param('id') id: string): Promise<RoomTypeRecord[]> {
    return this.service.listRoomTypes(id);
  }

  @Post(':id/room-types')
  @ApiOperation({ summary: 'Add a room type' })
  @ApiCreatedResponse({ description: 'Room type created' })
  createRoomType(@Param('id') id: string, @Body() body: unknown): Promise<RoomTypeRecord> {
    return this.service.createRoomType(id, CreateRoomTypeSchema.parse(body));
  }

  @Patch(':id/room-types/:roomTypeId')
  @ApiOperation({ summary: 'Update a room type' })
  updateRoomType(
    @Param('id') id: string,
    @Param('roomTypeId') roomTypeId: string,
    @Body() body: unknown,
  ): Promise<RoomTypeRecord> {
    return this.service.updateRoomType(id, roomTypeId, UpdateRoomTypeSchema.parse(body ?? {}));
  }

  @Get(':id/rate-plans')
  @ApiOperation({ summary: 'List rate plans for a property' })
  listRatePlans(@Param('id') id: string): Promise<RatePlanRecord[]> {
    return this.service.listRatePlans(id);
  }

  @Post(':id/rate-plans')
  @ApiOperation({ summary: 'Add a rate plan' })
  @ApiCreatedResponse({ description: 'Rate plan created' })
  createRatePlan(@Param('id') id: string, @Body() body: unknown): Promise<RatePlanRecord> {
    return this.service.createRatePlan(id, CreateRatePlanSchema.parse(body));
  }

  @Patch(':id/rate-plans/:ratePlanId')
  @ApiOperation({ summary: 'Update a rate plan' })
  updateRatePlan(
    @Param('id') id: string,
    @Param('ratePlanId') ratePlanId: string,
    @Body() body: unknown,
  ): Promise<RatePlanRecord> {
    return this.service.updateRatePlan(id, ratePlanId, UpdateRatePlanSchema.parse(body ?? {}));
  }

  @Get(':id/rates')
  @ApiOperation({ summary: 'List nightly rates for a date window' })
  listRates(@Param('id') id: string, @Query() query: unknown): Promise<NightlyRateRecord[]> {
    return this.service.listNightlyRates(id, RatesQuerySchema.parse(query ?? {}));
  }

  @Post(':id/rates')
  @ApiOperation({ summary: 'Update nightly rates for selected nights' })
  updateRates(@Param('id') id: string, @Body() body: unknown): Promise<{ updated: number }> {
    return this.service.updateNightlyRates(id, UpdateRatesSchema.parse(body));
  }

  @Get(':id/rooms')
  @ApiOperation({ summary: 'List rooms for a property' })
  listRooms(@Param('id') id: string): Promise<RoomRecord[]> {
    return this.service.listRooms(id);
  }

  @Post(':id/rooms')
  @ApiOperation({ summary: 'Add one room or a numbered run' })
  @ApiCreatedResponse({ description: 'Rooms created' })
  createRooms(@Param('id') id: string, @Body() body: unknown): Promise<RoomRecord[]> {
    return this.service.createRooms(id, CreateRoomsSchema.parse(body));
  }

  @Patch(':id/rooms/:roomId')
  @ApiOperation({ summary: 'Update a room status or note' })
  updateRoom(@Param('id') id: string, @Param('roomId') roomId: string, @Body() body: unknown): Promise<RoomRecord> {
    return this.service.updateRoom(id, roomId, UpdateRoomSchema.parse(body ?? {}));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one supplier property' })
  @ApiOkResponse({ description: 'Property record' })
  get(@Param('id') id: string): Promise<PropertyRecord> {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a property draft' })
  @ApiCreatedResponse({ description: 'Property created' })
  create(@Body() body: unknown): Promise<PropertyRecord> {
    return this.service.create(CreatePropertySchema.parse(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a supplier property' })
  @ApiOkResponse({ description: 'Property updated' })
  update(@Param('id') id: string, @Body() body: unknown): Promise<PropertyRecord> {
    return this.service.update(id, UpdatePropertySchema.parse(body ?? {}));
  }
}
