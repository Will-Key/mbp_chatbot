import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateOtpVerification } from './dto/create-otp-verification.dto';
import { VerifyOtpVerificationDto } from './dto/verify-otp-verification.dto';

@Injectable()
export class OtpVerificationService {
  constructor(private prismaService: PrismaService) { }
  
  create(data: CreateOtpVerification) {
    return this.prismaService.otpVerification.create({data})
  }

  findFirst(data: VerifyOtpVerificationDto) {
    return this.prismaService.otpVerification.findFirst({ where: data })
  }

  update(id: number, isUsed: boolean) {
    return this.prismaService.otpVerification.update({
      where: { id },
      data: { isUsed }
    })
  }

  async setOtpToUsed(id: number) {
    return await this.prismaService.otpVerification.update({
      where: { id },
      data: { isUsed: true }
    })
  }
}
