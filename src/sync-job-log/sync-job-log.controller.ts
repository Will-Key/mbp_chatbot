import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common'
import { SyncJobLogService } from './sync-job-log.service'

@Controller('sync-job-log')
export class SyncJobLogController {
  constructor(private readonly syncJobLogService: SyncJobLogService) {}

  @Get()
  findAll(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.syncJobLogService.findAll(limit)
  }
}