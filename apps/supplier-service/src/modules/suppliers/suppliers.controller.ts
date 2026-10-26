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
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '@mtw/common';
import type { AuthenticatedUser } from '@mtw/security';
import { SupplierService } from './suppliers.service';
import {
  CreateSupplierAccountSchema,
  SupplierLoginSchema,
  SupplierQuerySchema,
  UpdateSupplierAccountSchema,
  UpdateSupplierStatusSchema,
  ValidateSupplierSchema,
} from './dto';

@ApiTags('suppliers')
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly service: SupplierService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Supplier service health probe' })
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return this.service.health();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a supplier account' })
  create(@Body() body: unknown) {
    return this.service.create(CreateSupplierAccountSchema.parse(body));
  }

  @Get()
  @ApiOperation({ summary: 'List supplier accounts' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'vertical', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(@Query() query: unknown) {
    return this.service.list(SupplierQuerySchema.parse(query ?? {}));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supplier portal login' })
  login(@Body() body: unknown) {
    const dto = SupplierLoginSchema.parse(body);
    return this.service.login(dto.email, dto.password);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier account' })
  @ApiParam({ name: 'id', type: String })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update supplier account' })
  @ApiParam({ name: 'id', type: String })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.service.update(id, UpdateSupplierAccountSchema.parse(body));
  }

  @Patch(':id/validate')
  @ApiOperation({ summary: 'Approve or reject a pending supplier' })
  @ApiParam({ name: 'id', type: String })
  validate(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.service.validate(id, ValidateSupplierSchema.parse(body), user?.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update supplier status' })
  @ApiParam({ name: 'id', type: String })
  status(@Param('id') id: string, @Body() body: unknown) {
    return this.service.updateStatus(id, UpdateSupplierStatusSchema.parse(body));
  }

  @Post(':id/impersonate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Open supplier portal as this account (supervision)' })
  @ApiParam({ name: 'id', type: String })
  impersonate(@Param('id') id: string) {
    return this.service.impersonate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier account' })
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
