import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });

    // Apply custom methods after initialization
    this.extendClient();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('PrismaService initialized and connected to the database');
  }

  private extendClient() {
    // Add softDelete method to user model
    Object.assign(this.user, {
      softDelete: async ({ where }: { where: Prisma.UserWhereUniqueInput }) => {
        return this.user.update({
          where,
          data: {
            is_deleted: true,
            deleted_at: new Date()
          }
        });
      },
      
      // Add method to restore soft-deleted users
      restore: async ({ where }: { where: Prisma.UserWhereUniqueInput }) => {
        return this.user.update({
          where,
          data: {
            is_deleted: false,
            deleted_at: null
          }
        });
      },
      
      // Add method to find users including deleted ones
      findWithDeleted: async (args?: Prisma.UserFindManyArgs) => {
        return this.user.findMany({
          ...args,
          where: {
            ...args?.where,
            // Remove is_deleted filter if present
            is_deleted: false
          }
        });
      }
    });
  }
}