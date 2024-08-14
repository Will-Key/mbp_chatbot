import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateManualQueueDto } from './dto/create-manual-queue.dto';

@Injectable()
export class ManualQueueService {
    constructor(private readonly prismaService: PrismaService) { }

    create(data: CreateManualQueueDto) {
        return this.prismaService.manualQueue.create({ data })
    }

    findOne(id: string) {
        return this.prismaService.manualQueue.findUnique({ where: { id } })
    }

    findAll() {
        return this.prismaService.manualQueue.findMany()
    }

    delete(id: string) {
        return this.prismaService.manualQueue.delete({ where: { id } })
    }
}
