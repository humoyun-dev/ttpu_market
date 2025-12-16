import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma/prisma.service';
import { TelegramApiService } from '../telegram/telegram-api.service';
import { TelegramBotService } from '../telegram/telegram-bot.service';

@Processor('broadcast')
export class BroadcastProcessor extends WorkerHost {
  private readonly logger = new Logger(BroadcastProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramApi: TelegramApiService,
    private readonly botService: TelegramBotService,
  ) {
    super();
  }

  async process(job: Job<{ campaignId: string; storeId: string }>) {
    const { campaignId, storeId } = job.data;
    this.logger.log(`Processing broadcast job for campaign ${campaignId}`);

    try {
      // Get campaign
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: BigInt(campaignId) },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get bot token
      const token = await this.botService.getDecryptedToken(BigInt(storeId));

      // Get pending recipients in batches
      const batchSize = 25;
      let processed = 0;

      while (true) {
        const recipients = await this.prisma.campaignRecipient.findMany({
          where: {
            campaignId: BigInt(campaignId),
            status: 'PENDING',
          },
          include: {
            telegramCustomer: true,
          },
          take: batchSize,
        });

        if (recipients.length === 0) {
          break;
        }

        for (const recipient of recipients) {
          try {
            // Send message
            if (campaign.imageUrl) {
              await this.telegramApi.sendPhoto(
                token,
                Number(recipient.telegramCustomer.telegramUserId),
                campaign.imageUrl,
                { caption: campaign.message },
              );
            } else {
              await this.telegramApi.sendMessage(
                token,
                Number(recipient.telegramCustomer.telegramUserId),
                campaign.message,
              );
            }

            // Update recipient status
            await this.prisma.campaignRecipient.update({
              where: { id: recipient.id },
              data: {
                status: 'SENT',
                sentAt: new Date(),
              },
            });

            processed++;
          } catch (error: any) {
            this.logger.error(`Failed to send to ${recipient.telegramCustomer.telegramUserId}:`, error.message);

            await this.prisma.campaignRecipient.update({
              where: { id: recipient.id },
              data: {
                status: 'FAILED',
                error: error.message,
              },
            });
          }

          // Rate limiting delay (30 messages per second max)
          await new Promise((resolve) => setTimeout(resolve, 40));
        }

        // Progress update
        await job.updateProgress((processed / recipients.length) * 100);
      }

      // Update campaign status
      await this.prisma.campaign.update({
        where: { id: BigInt(campaignId) },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      this.logger.log(`Campaign ${campaignId} completed. Processed ${processed} recipients.`);

      return { processed };
    } catch (error) {
      this.logger.error(`Broadcast job failed for campaign ${campaignId}:`, error);
      throw error;
    }
  }
}
