import { Module } from '@nestjs/common'
import { OtpVerificationService } from './otp-verification.service'
import { PrismaService } from 'prisma/prisma.service'

@Module({
  providers: [OtpVerificationService, PrismaService],
  exports: [OtpVerificationService],
})
export class OtpVerificationModule {}
