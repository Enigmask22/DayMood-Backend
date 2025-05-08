import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CustomPrismaService } from 'nestjs-prisma';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
