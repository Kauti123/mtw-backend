import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CommercialDeleteResponseOpenApi,
  ConvenienceFeeListResponseOpenApi,
  ConvenienceFeeRecordOpenApi,
  CreateConvenienceFeeExample,
  CreateConvenienceFeeOpenApi,
  CreateDiscountRuleExample,
  CreateDiscountRuleOpenApi,
  CreateGstRuleExample,
  CreateGstRuleOpenApi,
  CreateServiceFeeExample,
  CreateServiceFeeOpenApi,
  CreateSupplierCommissionExample,
  CreateSupplierCommissionOpenApi,
  DiscountRuleListResponseOpenApi,
  DiscountRuleRecordOpenApi,
  GstRuleListResponseOpenApi,
  GstRuleRecordOpenApi,
  ServiceFeeListResponseOpenApi,
  ServiceFeeRecordOpenApi,
  SupplierCommissionListResponseOpenApi,
  SupplierCommissionRecordOpenApi,
  UpdateCommercialStatusOpenApi,
  UpdateConvenienceFeeOpenApi,
  UpdateDiscountRuleOpenApi,
  UpdateGstRuleOpenApi,
  UpdateServiceFeeOpenApi,
  UpdateSupplierCommissionOpenApi,
} from '@mtw/contracts';
import { CommercialService } from './commercial.service';
import {
  ConvenienceFeeQuerySchema,
  CreateConvenienceFeeSchema,
  CreateDiscountRuleSchema,
  CreateGstRuleSchema,
  CreateServiceFeeSchema,
  CreateSupplierCommissionSchema,
  DiscountRuleQuerySchema,
  GstRuleQuerySchema,
  ServiceFeeQuerySchema,
  SupplierCommissionQuerySchema,
  UpdateCommercialStatusSchema,
  UpdateConvenienceFeeSchema,
  UpdateDiscountRuleSchema,
  UpdateGstRuleSchema,
  UpdateServiceFeeSchema,
  UpdateSupplierCommissionSchema,
} from './dto';

const productEnum = ['FLIGHT', 'HOTEL', 'CAR', 'TRAIN', 'BUS'] as const;
const statusEnum = ['ACTIVE', 'INACTIVE'] as const;

@ApiTags('supplier-commissions')
@Controller('supplier-commissions')
export class SupplierCommissionsController {
  constructor(private readonly service: CommercialService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create supplier commission rule' })
  @ApiBody({
    schema: CreateSupplierCommissionOpenApi,
    examples: { default: { value: CreateSupplierCommissionExample } },
  })
  @ApiCreatedResponse({ schema: SupplierCommissionRecordOpenApi })
  create(@Body() body: unknown) {
    return this.service.createCommission(CreateSupplierCommissionSchema.parse(body));
  }

  @Get()
  @ApiOperation({ summary: 'List supplier commission rules' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'supplierName', required: false })
  @ApiQuery({ name: 'productType', required: false, enum: productEnum })
  @ApiQuery({ name: 'status', required: false, enum: statusEnum })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: SupplierCommissionListResponseOpenApi })
  list(@Query() query: unknown) {
    return this.service.listCommissions(SupplierCommissionQuerySchema.parse(query ?? {}));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier commission by ID' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ schema: SupplierCommissionRecordOpenApi })
  get(@Param('id') id: string) {
    return this.service.getCommission(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update supplier commission status' })
  @ApiBody({ schema: UpdateCommercialStatusOpenApi })
  @ApiOkResponse({ schema: SupplierCommissionRecordOpenApi })
  status(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateCommissionStatus(id, UpdateCommercialStatusSchema.parse(body));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update supplier commission' })
  @ApiBody({ schema: UpdateSupplierCommissionOpenApi })
  @ApiOkResponse({ schema: SupplierCommissionRecordOpenApi })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateCommission(id, UpdateSupplierCommissionSchema.parse(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Patch supplier commission' })
  @ApiBody({ schema: UpdateSupplierCommissionOpenApi })
  @ApiOkResponse({ schema: SupplierCommissionRecordOpenApi })
  patch(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateCommission(id, UpdateSupplierCommissionSchema.parse(body));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete supplier commission' })
  @ApiOkResponse({ schema: CommercialDeleteResponseOpenApi })
  delete(@Param('id') id: string) {
    return this.service.deleteCommission(id);
  }
}

@ApiTags('service-fees')
@Controller('service-fees')
export class ServiceFeesController {
  constructor(private readonly service: CommercialService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create service fee' })
  @ApiBody({
    schema: CreateServiceFeeOpenApi,
    examples: { default: { value: CreateServiceFeeExample } },
  })
  @ApiCreatedResponse({ schema: ServiceFeeRecordOpenApi })
  create(@Body() body: unknown) {
    return this.service.createServiceFee(CreateServiceFeeSchema.parse(body));
  }

  @Get()
  @ApiOperation({ summary: 'List service fees' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'productType',
    required: false,
    enum: ['FLIGHT', 'HOTEL', 'VISA', 'INSURANCE', 'OTHER', 'CAR', 'TRAIN', 'BUS'],
  })
  @ApiQuery({ name: 'status', required: false, enum: statusEnum })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: ServiceFeeListResponseOpenApi })
  list(@Query() query: unknown) {
    return this.service.listServiceFees(ServiceFeeQuerySchema.parse(query ?? {}));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service fee by ID' })
  @ApiOkResponse({ schema: ServiceFeeRecordOpenApi })
  get(@Param('id') id: string) {
    return this.service.getServiceFee(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update service fee status' })
  @ApiBody({ schema: UpdateCommercialStatusOpenApi })
  @ApiOkResponse({ schema: ServiceFeeRecordOpenApi })
  status(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateServiceFeeStatus(id, UpdateCommercialStatusSchema.parse(body));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update service fee' })
  @ApiBody({ schema: UpdateServiceFeeOpenApi })
  @ApiOkResponse({ schema: ServiceFeeRecordOpenApi })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateServiceFee(id, UpdateServiceFeeSchema.parse(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Patch service fee' })
  @ApiBody({ schema: UpdateServiceFeeOpenApi })
  @ApiOkResponse({ schema: ServiceFeeRecordOpenApi })
  patch(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateServiceFee(id, UpdateServiceFeeSchema.parse(body));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service fee' })
  @ApiOkResponse({ schema: CommercialDeleteResponseOpenApi })
  delete(@Param('id') id: string) {
    return this.service.deleteServiceFee(id);
  }
}

@ApiTags('convenience-fees')
@Controller('convenience-fees')
export class ConvenienceFeesController {
  constructor(private readonly service: CommercialService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create convenience fee' })
  @ApiBody({
    schema: CreateConvenienceFeeOpenApi,
    examples: { default: { value: CreateConvenienceFeeExample } },
  })
  @ApiCreatedResponse({ schema: ConvenienceFeeRecordOpenApi })
  create(@Body() body: unknown) {
    return this.service.createConvenienceFee(CreateConvenienceFeeSchema.parse(body));
  }

  @Get()
  @ApiOperation({ summary: 'List convenience fees' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'productType',
    required: false,
    enum: ['FLIGHT', 'HOTEL', 'CAR', 'TRAIN', 'BUS', 'ALL'],
  })
  @ApiQuery({
    name: 'channel',
    required: false,
    enum: ['WEB', 'MOBILE_APP', 'AGENT_PORTAL', 'OFFLINE', 'ALL'],
  })
  @ApiQuery({ name: 'status', required: false, enum: statusEnum })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: ConvenienceFeeListResponseOpenApi })
  list(@Query() query: unknown) {
    return this.service.listConvenienceFees(ConvenienceFeeQuerySchema.parse(query ?? {}));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get convenience fee by ID' })
  @ApiOkResponse({ schema: ConvenienceFeeRecordOpenApi })
  get(@Param('id') id: string) {
    return this.service.getConvenienceFee(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update convenience fee status' })
  @ApiBody({ schema: UpdateCommercialStatusOpenApi })
  @ApiOkResponse({ schema: ConvenienceFeeRecordOpenApi })
  status(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateConvenienceFeeStatus(id, UpdateCommercialStatusSchema.parse(body));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update convenience fee' })
  @ApiBody({ schema: UpdateConvenienceFeeOpenApi })
  @ApiOkResponse({ schema: ConvenienceFeeRecordOpenApi })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateConvenienceFee(id, UpdateConvenienceFeeSchema.parse(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Patch convenience fee' })
  @ApiBody({ schema: UpdateConvenienceFeeOpenApi })
  @ApiOkResponse({ schema: ConvenienceFeeRecordOpenApi })
  patch(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateConvenienceFee(id, UpdateConvenienceFeeSchema.parse(body));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete convenience fee' })
  @ApiOkResponse({ schema: CommercialDeleteResponseOpenApi })
  delete(@Param('id') id: string) {
    return this.service.deleteConvenienceFee(id);
  }
}

@ApiTags('discount-rules')
@Controller('discount-rules')
export class DiscountRulesController {
  constructor(private readonly service: CommercialService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create discount rule' })
  @ApiBody({
    schema: CreateDiscountRuleOpenApi,
    examples: { default: { value: CreateDiscountRuleExample } },
  })
  @ApiCreatedResponse({ schema: DiscountRuleRecordOpenApi })
  create(@Body() body: unknown) {
    return this.service.createDiscount(CreateDiscountRuleSchema.parse(body));
  }

  @Get()
  @ApiOperation({ summary: 'List discount rules' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'productType',
    required: false,
    enum: ['FLIGHT', 'HOTEL', 'CAR', 'TRAIN', 'BUS', 'ALL'],
  })
  @ApiQuery({ name: 'discountType', required: false, enum: ['PERCENTAGE', 'FIXED'] })
  @ApiQuery({ name: 'status', required: false, enum: statusEnum })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: DiscountRuleListResponseOpenApi })
  list(@Query() query: unknown) {
    return this.service.listDiscounts(DiscountRuleQuerySchema.parse(query ?? {}));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discount rule by ID' })
  @ApiOkResponse({ schema: DiscountRuleRecordOpenApi })
  get(@Param('id') id: string) {
    return this.service.getDiscount(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update discount rule status' })
  @ApiBody({ schema: UpdateCommercialStatusOpenApi })
  @ApiOkResponse({ schema: DiscountRuleRecordOpenApi })
  status(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateDiscountStatus(id, UpdateCommercialStatusSchema.parse(body));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update discount rule' })
  @ApiBody({ schema: UpdateDiscountRuleOpenApi })
  @ApiOkResponse({ schema: DiscountRuleRecordOpenApi })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateDiscount(id, UpdateDiscountRuleSchema.parse(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Patch discount rule' })
  @ApiBody({ schema: UpdateDiscountRuleOpenApi })
  @ApiOkResponse({ schema: DiscountRuleRecordOpenApi })
  patch(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateDiscount(id, UpdateDiscountRuleSchema.parse(body));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete discount rule' })
  @ApiOkResponse({ schema: CommercialDeleteResponseOpenApi })
  delete(@Param('id') id: string) {
    return this.service.deleteDiscount(id);
  }
}

@ApiTags('gst-rules')
@Controller('gst-rules')
export class GstRulesController {
  constructor(private readonly service: CommercialService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create GST rule' })
  @ApiBody({
    schema: CreateGstRuleOpenApi,
    examples: { default: { value: CreateGstRuleExample } },
  })
  @ApiCreatedResponse({ schema: GstRuleRecordOpenApi })
  create(@Body() body: unknown) {
    return this.service.createGst(CreateGstRuleSchema.parse(body));
  }

  @Get()
  @ApiOperation({ summary: 'List GST rules' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'productType', required: false, enum: productEnum })
  @ApiQuery({ name: 'status', required: false, enum: statusEnum })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ schema: GstRuleListResponseOpenApi })
  list(@Query() query: unknown) {
    return this.service.listGst(GstRuleQuerySchema.parse(query ?? {}));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get GST rule by ID' })
  @ApiOkResponse({ schema: GstRuleRecordOpenApi })
  get(@Param('id') id: string) {
    return this.service.getGst(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update GST rule status' })
  @ApiBody({ schema: UpdateCommercialStatusOpenApi })
  @ApiOkResponse({ schema: GstRuleRecordOpenApi })
  status(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateGstStatus(id, UpdateCommercialStatusSchema.parse(body));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update GST rule' })
  @ApiBody({ schema: UpdateGstRuleOpenApi })
  @ApiOkResponse({ schema: GstRuleRecordOpenApi })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateGst(id, UpdateGstRuleSchema.parse(body));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Patch GST rule' })
  @ApiBody({ schema: UpdateGstRuleOpenApi })
  @ApiOkResponse({ schema: GstRuleRecordOpenApi })
  patch(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateGst(id, UpdateGstRuleSchema.parse(body));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete GST rule' })
  @ApiOkResponse({ schema: CommercialDeleteResponseOpenApi })
  delete(@Param('id') id: string) {
    return this.service.deleteGst(id);
  }
}
