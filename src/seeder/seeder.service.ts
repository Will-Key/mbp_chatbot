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
    for (const initialStep of INITIAL_STEPS) {
      const existingStep = await this.stepService.findOneBylevelAndFlowId(
        initialStep.level,
        initialStep.flowId,
      )
      console.log('existingStep', existingStep)
      if (!existingStep) {
        await this.stepService.createWithBadResponseMessage(initialStep)
      } else if (this.hasStepChanged(existingStep, initialStep)) {
        await this.stepService.updateStep(existingStep.id, initialStep)
      }
    }
  }

  private hasStepChanged(existingStep: any, initialStep: any): boolean {
    // Comparaison des champs principaux
    if (existingStep.message !== initialStep.message) return true
    if (existingStep.expectedResponse !== initialStep.expectedResponse)
      return true
    if (existingStep.expectedResponseType !== initialStep.expectedResponseType)
      return true

    // Comparaison des messages de mauvaise réponse
    const existingMessages = existingStep.stepBadResponseMessage || []
    const initialMessages = initialStep.badResponseMessage || []

    if (existingMessages.length !== initialMessages.length) return true

    // Vérification détaillée des messages
    for (let i = 0; i < initialMessages.length; i++) {
      const existing = existingMessages.find(
        (m) => m.errorType === initialMessages[i].errorType,
      )
      if (!existing || existing.message !== initialMessages[i].message) {
        return true
      }
    }

    return false
  }
}
