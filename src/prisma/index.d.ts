import { Prisma, User } from '@prisma/client';

declare module '@prisma/client' {
  export namespace PrismaClient {
    export interface UserDelegate<
      GlobalRejectSettings = Prisma.RejectOnNotFound | Prisma.RejectPerOperation,
    > {
      /**
       * Soft delete a user by setting is_deleted to true and deleted_at to current date
       */
      softDelete(where: Prisma.UserWhereUniqueInput): Promise<User>;
      
      /**
       * Restore a soft-deleted user
       */
      restore(where: Prisma.UserWhereUniqueInput): Promise<User>;
      
      /**
       * Find users including soft-deleted ones
       */
      findWithDeleted(args?: Prisma.UserFindManyArgs): Promise<User[]>;
    }
  }
} 