import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCampaignDto } from './dto';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('broadcast') private broadcastQueue: Queue,
  ) {}

  async createCampaign(storeId: bigint, dto: CreateCampaignDto) {
    const campaign = await this.prisma.campaign.create({
      data: {
        storeId,
        name: dto.name,
        message: dto.message,
        imageUrl: dto.imageUrl,
        segmentId: dto.segmentId ? BigInt(dto.segmentId) : null,
        scheduledAt: dto.scheduledAt,
        status: dto.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    return campaign;
  }

  async getCampaigns(storeId: bigint) {
    return this.prisma.campaign.findMany({
      where: { storeId },
      include: {
        segment: { select: { id: true, name: true } },
        _count: { select: { recipients: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaign(storeId: bigint, campaignId: bigint) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, storeId },
      include: {
        segment: true,
        recipients: {
          take: 100,
          include: {
            telegramCustomer: {
              select: { id: true, firstName: true, lastName: true, username: true },
            },
          },
        },
        _count: { select: { recipients: true } },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async dispatchCampaign(storeId: bigint, campaignId: bigint) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, storeId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
      throw new BadRequestException('Campaign already sent or sending');
    }

    // Get eligible customers
    const customers = await this.prisma.telegramCustomer.findMany({
      where: {
        storeId,
        marketingOptIn: true,
        isBlocked: false,
      },
      select: { id: true },
    });

    if (customers.length === 0) {
      throw new BadRequestException('No eligible recipients found');
    }

    // Create recipients
    await this.prisma.campaignRecipient.createMany({
      skipDuplicates: true,
      data: customers.map((customer) => ({
        campaignId,
        telegramCustomerId: customer.id,
        status: 'PENDING',
      })),
    });

    // Update campaign status
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    });

    // Enqueue broadcast job
    await this.broadcastQueue.add('send-campaign', {
      campaignId: campaignId.toString(),
      storeId: storeId.toString(),
    });

    this.logger.log(`Campaign ${campaignId} dispatched with ${customers.length} recipients`);

    return {
      message: 'Campaign dispatched successfully',
      recipientCount: customers.length,
    };
  }

  // Segments
  async createSegment(storeId: bigint, name: string, filters: Record<string, any>) {
    return this.prisma.segment.create({
      data: {
        storeId,
        name,
        filters,
      },
    });
  }

  async getSegments(storeId: bigint) {
    return this.prisma.segment.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Customer Tags
  async createTag(storeId: bigint, name: string, color?: string) {
    return this.prisma.customerTag.create({
      data: {
        storeId,
        name,
        color: color || '#3B82F6',
      },
    });
  }

  async getTags(storeId: bigint) {
    return this.prisma.customerTag.findMany({
      where: { storeId },
      include: { _count: { select: { links: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async tagCustomer(tagId: bigint, customerId: bigint) {
    return this.prisma.customerTagLink.create({
      data: {
        tagId,
        telegramCustomerId: customerId,
      },
    });
  }

  async untagCustomer(tagId: bigint, customerId: bigint) {
    await this.prisma.customerTagLink.deleteMany({
      where: {
        tagId,
        telegramCustomerId: customerId,
      },
    });
    return { deleted: true };
  }
}
