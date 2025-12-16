import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { CreateCampaignDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { StoresService } from '../stores/stores.service';

@ApiTags('CRM')
@Controller('stores/:storeId')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly storesService: StoresService,
  ) {}

  // Campaigns
  @Post('campaigns')
  @ApiOperation({ summary: 'Create a campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  async createCampaign(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.crmService.createCampaign(BigInt(storeId), dto);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Get all campaigns' })
  @ApiResponse({ status: 200, description: 'List of campaigns' })
  async getCampaigns(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.crmService.getCampaigns(BigInt(storeId));
  }

  @Get('campaigns/:campaignId')
  @ApiOperation({ summary: 'Get a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign details' })
  async getCampaign(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('campaignId') campaignId: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.crmService.getCampaign(BigInt(storeId), BigInt(campaignId));
  }

  @Post('campaigns/:campaignId/dispatch')
  @ApiOperation({ summary: 'Dispatch a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign dispatched' })
  async dispatchCampaign(
    @CurrentUser() user: any,
    @Param('storeId') storeId: string,
    @Param('campaignId') campaignId: string,
  ) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.crmService.dispatchCampaign(BigInt(storeId), BigInt(campaignId));
  }

  // Segments
  @Get('segments')
  @ApiOperation({ summary: 'Get all segments' })
  @ApiResponse({ status: 200, description: 'List of segments' })
  async getSegments(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.crmService.getSegments(BigInt(storeId));
  }

  // Tags
  @Get('tags')
  @ApiOperation({ summary: 'Get all customer tags' })
  @ApiResponse({ status: 200, description: 'List of tags' })
  async getTags(@CurrentUser() user: any, @Param('storeId') storeId: string) {
    await this.storesService.verifyOwnership(BigInt(storeId), BigInt(user.id));
    return this.crmService.getTags(BigInt(storeId));
  }
}
