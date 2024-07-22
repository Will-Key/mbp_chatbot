import {
  //Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
import { RequestLogService } from './request-log.service'
import { CreateRequestLogDto } from './dto/create-request-log.dto'
import { UpdateRequestLogDto } from './dto/update-request-log.dto'

//@Controller('request-log')
export class RequestLogController {
  constructor(private readonly requestLogService: RequestLogService) {}

  @Post()
  create(@Body() createRequestLogDto: CreateRequestLogDto) {
    return this.requestLogService.create(createRequestLogDto)
  }

  @Get()
  findAll() {
    return this.requestLogService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestLogService.findOne(+id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRequestLogDto: UpdateRequestLogDto,
  ) {
    return this.requestLogService.update(+id, updateRequestLogDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.requestLogService.remove(+id)
  }
}
