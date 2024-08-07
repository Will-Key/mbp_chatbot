import { Conversation, Step, StepBadResponseMessage,  } from '@prisma/client'

export type ConversationType = Conversation & {
  step: Step & {
    stepBadResponseMessage: StepBadResponseMessage[]
  }
}
