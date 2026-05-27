import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PlantsController } from './plants.controller';
import { PlantsService } from './plants.service';

@Module({
  imports: [HttpModule],
  controllers: [PlantsController],
  providers: [PlantsService],
  exports: [PlantsService],
})
export class PlantsModule {}
