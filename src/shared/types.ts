import { Conversation, Step } from '@prisma/client'

export type ConversationType = Conversation & { step: Step }
