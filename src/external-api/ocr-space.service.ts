import { Injectable, Logger } from '@nestjs/common'
import { DocumentFile } from '@prisma/client'
import { RequestLogService } from '../request-log/request-log.service'
import { ocrSpace } from 'ocr-space-api-wrapper'
import { SendDocDto } from './dto/send-doc.dto'
import { GetOcrResponseDto } from './dto/get-ocr-response.dto'
import { ConversationService } from '../conversation/conversation.service'
import { DriverPersonnalInfoService } from '../driver-personnal-info/driver-personnal-info.service'
import { DriverLicenseInfoService } from '../driver-license-info/driver-license-info.service'
import { CarInfoService } from '../car-info/car-info.service'

@Injectable()
export class OcrSpaceService {
  private readonly logger = new Logger(OcrSpaceService.name)

  constructor(
    private readonly requestLogService: RequestLogService,
    private readonly conversationService: ConversationService,
    private readonly driverPersonnalInfoService: DriverPersonnalInfoService,
    private readonly driverLicenseInfoService: DriverLicenseInfoService,
    private readonly carInfoService: CarInfoService,
  ) {}

  async sendFile(file: DocumentFile) {
    const params: SendDocDto = {
      apiKey: process.env.OCR_SPACE_TOKEN,
      language: 'fre',
      detectOrientation: true,
      scale: true,
      isTable: true,
      OCREngine: '2',
    }

    try {
      const response = await ocrSpace(file.dataImageUrl, params)
      this.logger.log(`whapi response: ${response}`)
      this.processOcrResponse(response, file)
      await this.requestLogService.create({
        direction: 'OUT',
        status: 'SUCCESS',
        initiator: 'MBP',
        data: JSON.stringify(response.ParsedResults),
        response: response.ErrorMessage,
      })
    } catch (error) {
      this.logger.log(`whapi error: ${error}`)
      await this.requestLogService.create({
        direction: 'OUT',
        status: 'FAIL',
        initiator: 'MBP',
        data: JSON.stringify(file),
        response: JSON.stringify(error),
      })
    }
  }

  private async processOcrResponse(
    response: GetOcrResponseDto,
    file: DocumentFile,
  ) {
    const responseLines = response.ParsedResults[0].TextOverlay[
      'Lines'
    ] as Array<{
      LineText: string
    }>
    if (file.documentType === 'DRIVER_LICENSE')
      await this.getDriverLicenseData(responseLines, file)
    else this.getCarRegistrationData(responseLines, file.whaPhoneNumber)
  }

  private async getDriverLicenseData(
    responseLines: {
      LineText: string
    }[],
    file: DocumentFile,
  ) {
    if (file.documentSide === 'FRONT')
      await this.getDriverLicenseFrontData(responseLines, file.whaPhoneNumber)
    else this.getDriverLicenseBackData(responseLines, file.whaPhoneNumber)
  }

  private async getDriverLicenseFrontData(
    responseLines: {
      LineText: string
    }[],
    whaPhoneNumber: string,
  ) {
    const phoneNumber = await this.getDriverPhoneNumber(whaPhoneNumber)

    const lastName = responseLines[5].LineText
    const firstName = responseLines[7].LineText
    const licenseNumber = responseLines[13].LineText

    try {
      await this.driverPersonnalInfoService.create({
        lastName,
        firstName,
        phoneNumber,
        whaPhoneNumber,
        licenseNumber,
        collectMethod: 'OCR',
      })
    } catch (error) {
      this.logger.error(error)
    }
  }

  private async getDriverLicenseBackData(
    responseLines: {
      LineText: string
    }[],
    whaPhoneNumber: string,
  ) {
    const phoneNumber = await this.getDriverPhoneNumber(whaPhoneNumber)

    try {
      const licenseDeliveryDate = responseLines[2].LineText

      const licenseExpiryDate = responseLines[8].LineText

      await this.driverLicenseInfoService.create({
        countryCode: 'CIV',
        expiryDate: licenseExpiryDate,
        deliveryDate: licenseDeliveryDate,
        driverPhoneNumber: phoneNumber,
      })
    } catch (error) {
      this.logger.error(error)
    }
  }

  private async getCarRegistrationData(
    responseLines: { LineText: string }[],
    whaPhoneNumber: string,
  ) {
    const phoneNumber = await this.getDriverPhoneNumber(whaPhoneNumber)
    const plateNumber = responseLines[1].LineText
    const brand = responseLines[15].LineText
    const color = responseLines[19].LineText
    const year = responseLines[6].LineText.split('-')[2]

    try {
      await this.carInfoService.create({
        brand,
        color,
        year,
        plateNumber,
        status: 'unknown',
        code: '',
        driverPhoneNumber: phoneNumber,
      })
    } catch (error) {
      this.logger.error(error)
    }
  }

  private async getDriverPhoneNumber(whaPhoneNumber: string): Promise<string> {
    return (
      await this.conversationService.findManyByWhaPhoneNumber(whaPhoneNumber)
    ).find((conv) => conv.step.level === 2 && conv.step.flowId === 1).message
  }
}
