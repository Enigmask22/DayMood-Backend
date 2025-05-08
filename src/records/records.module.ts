import { Module } from '@nestjs/common';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [PrismaModule],
  // set up controller follow the version
  controllers: [RecordsController],
  providers: [RecordsService, PrismaService],
  exports: [RecordsService],
})
export class RecordsModule {}
