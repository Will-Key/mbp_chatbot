import { Injectable, Logger } from '@nestjs/common'
import { FlowService } from '../flow/flow.service'
import { StepService } from '../step/step.service'
import {
  INITIAL_APP_PARAMETERS,
  INITIAL_LOYALTY_BONUS_TIERS,
} from '../app-parameter/app-parameter.constants'
import { AppParameterService } from '../app-parameter/app-parameter.service'
import { LoyaltyBonusService } from '../loyalty-bonus/loyalty-bonus.service'
import { ReferralService } from '../referral/referral.service'
import { INITIAL_FLOWS, INITIAL_STEPS } from './constants'

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name)
  constructor(
    private readonly flowService: FlowService,
    private readonly stepService: StepService,
    private readonly appParameterService: AppParameterService,
    private readonly loyaltyBonusService: LoyaltyBonusService,
    private readonly referralService: ReferralService,
  ) {}

  async seed() {
    await this.createFlowsSeed()
    await this.createStepsSeed()
    await this.createAppParametersSeed()
    await this.createLoyaltyBonusTiersSeed()
    await this.createReferralCampaignSeed()

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
      const existingStep = await this.stepService.findOneBylevelAndidFlow(
        initialStep.level,
        initialStep.idFlow,
      )

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

  // Inserts only missing keys, so values edited in production are never
  // overwritten by a later deploy.
  private async createAppParametersSeed() {
    for (const parameter of INITIAL_APP_PARAMETERS) {
      const existing = await this.appParameterService.findValue(parameter.key)
      if (existing !== null) continue

      await this.appParameterService.upsert(
        parameter.key,
        parameter.value,
        parameter.description,
      )
      this.logger.log(`App parameter ${parameter.key} created`)
    }
  }

  private async createLoyaltyBonusTiersSeed() {
    if (await this.loyaltyBonusService.countTiers()) return

    for (const tier of INITIAL_LOYALTY_BONUS_TIERS) {
      await this.loyaltyBonusService.createTier(tier)
    }
    this.logger.log(
      `${INITIAL_LOYALTY_BONUS_TIERS.length} loyalty bonus tiers created`,
    )
  }

  private async createReferralCampaignSeed() {
    if (await this.referralService.countCampaigns()) return

    await this.referralService.createCampaign({
      name: 'Campagne de parrainage par défaut',
      startDate: new Date(),
      bonusAmount: await this.appParameterService.getReferralBonusAmount(),
    })
    this.logger.log('Default referral campaign created')
  }
}
