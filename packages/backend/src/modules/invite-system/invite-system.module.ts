import { Module } from '@nestjs/common';
import { InviteSystemController } from './invite-system.controller';
import { InviteSystemService } from './invite-system.service';

@Module({
  controllers: [InviteSystemController],
  providers: [InviteSystemService],
  exports: [InviteSystemService],
})
export class InviteSystemModule {}
