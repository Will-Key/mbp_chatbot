import { Module } from '@nestjs/common';
import { SeederModuleService } from './seeder-module.service';
import { SeederModuleController } from './seeder-module.controller';

@Module({
  controllers: [SeederModuleController],
  providers: [SeederModuleService],
})
export class SeederModuleModule {}
