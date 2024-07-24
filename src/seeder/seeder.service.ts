import { Injectable, Logger } from '@nestjs/common'
import { FlowService } from '../flow/flow.service'
import { StepService } from '../step/step.service'
import { INITIAL_FLOWS, INITIAL_STEPS } from './constants'

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name)
  constructor(
    private readonly flowService: FlowService,
    private readonly stepService: StepService,
  ) {}

  async seed() {
    await this.createFlowsSeed()
    await this.createStepsSeed()

    this.logger.log('Seeding completed')
  }

  private async createFlowsSeed() {
    const flows = await this.flowService.findAll()
    if (!flows.length) {
      for (const flow of INITIAL_FLOWS) {
        await this.flowService.create(flow)
      }
      return
    }
    this.logger.error('Flows already created')
  }

  private async createStepsSeed() {
    const seeds = await this.stepService.findAll()
    if (!seeds.length) {
      for (const step of INITIAL_STEPS) {
        await this.stepService.create(step)
      }
      return
    }
    this.logger.error('Steps already created')
  }
}
