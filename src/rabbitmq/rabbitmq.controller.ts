import { Controller } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';

@Controller()
export class RabbitmqController {
  constructor(private readonly rabbitmqService: RabbitmqService) {}
}
