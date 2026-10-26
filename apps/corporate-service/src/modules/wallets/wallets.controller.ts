import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';

@ApiTags('corporate-wallets')
@Controller('corporate-wallets')
export class WalletsController {
  constructor(private readonly service: WalletsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Corporate deposit + credit wallet available balance' })
  @ApiQuery({ name: 'corporateId', required: true, type: String })
  @ApiOkResponse({ description: 'Wallet balances' })
  async balance(@Query('corporateId') corporateId: string) {
    return this.service.snapshot(corporateId);
  }

  @Post('consume')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Deduct a booking amount from deposit first, then credit' })
  @ApiOkResponse({ description: 'Wallet utilization written' })
  async consume(
    @Body()
    body: {
      corporateId?: string;
      amount?: number;
      reference?: string | null;
      note?: string | null;
    },
  ) {
    return this.service.consume(body);
  }
}
