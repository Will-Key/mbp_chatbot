import { Injectable, Logger } from '@nestjs/common'
import { DocumentFile, DocumentType } from '@prisma/client'
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
      this.logger.log(`whapi response:`, response)
      const ocrResponse = await this.processOcrResponse(response, file)
      await this.requestLogService.create({
        direction: 'OUT',
        status: 'SUCCESS',
        initiator: 'MBP',
        data: JSON.stringify(response.ParsedResults),
        response: response.ErrorMessage,
      })
      console.log('ocrResponse', ocrResponse)
      return ocrResponse
    } catch (error) {
      this.logger.log(`whapi error: ${error}`)
      await this.requestLogService.create({
        direction: 'OUT',
        status: 'FAIL',
        initiator: 'MBP',
        data: JSON.stringify(file),
        response: JSON.stringify(error),
      })
      return 0
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
      return await this.getDriverLicenseData(responseLines, file)
    else
      return await this.getCarRegistrationData(
        responseLines,
        file.whaPhoneNumber,
      )
  }

  private async getDriverLicenseData(
    responseLines: {
      LineText: string
    }[],
    file: DocumentFile,
  ) {
    if (file.documentSide === 'FRONT')
      return await this.getDriverLicenseFrontData(
        responseLines,
        file.whaPhoneNumber,
      )
    else
      return await this.getDriverLicenseBackData(
        responseLines,
        file.whaPhoneNumber,
      )
  }

  private async getDriverLicenseFrontData(
    responseLines: {
      LineText: string
    }[],
    whaPhoneNumber: string,
  ) {
    const phoneNumber = await this.getDriverPhoneNumber(whaPhoneNumber)

    const lastNameIndex =
      responseLines.findIndex((line) => line.LineText.includes('1.')) + 1
    const firstNameIndex =
      responseLines.findIndex((line) => line.LineText.includes('2.')) + 1
    const licenseNumberIndex =
      responseLines.findIndex((line) => line.LineText.includes('5.')) + 1

    const lastName = responseLines[lastNameIndex].LineText
    const firstName = responseLines[firstNameIndex].LineText
    const licenseNumber = responseLines[licenseNumberIndex].LineText
    console.log('create driver license:', {
      lastName,
      firstName,
      phoneNumber,
      whaPhoneNumber,
      licenseNumber,
      collectMethod: 'OCR',
    })
    if (!this.isValidCard(licenseNumber, 'DRIVER_LICENSE')) return 0

    try {
      const driverPersonnalInfo = await this.driverPersonnalInfoService.create({
        lastName,
        firstName,
        phoneNumber,
        whaPhoneNumber,
        licenseNumber,
        collectMethod: 'OCR',
      })
      return driverPersonnalInfo.id
    } catch (error) {
      this.logger.error(error)
      return 0
    }
  }

  private async getDriverLicenseBackData(
    responseLines: {
      LineText: string
    }[],
    whaPhoneNumber: string,
  ) {
    const phoneNumber = await this.getDriverPhoneNumber(whaPhoneNumber)

    const licenseDeliveryDateIndex =
      responseLines.findIndex((line) => line.LineText.includes('8.')) + 2
    const licenseExpiryDateIndex =
      responseLines.findIndex((line) => line.LineText.includes('9.')) + 2

    try {
      const licenseDeliveryDate =
        responseLines[licenseDeliveryDateIndex].LineText
      const licenseExpiryDate = responseLines[licenseExpiryDateIndex].LineText

      const driverLicenseInfo = await this.driverLicenseInfoService.create({
        countryCode: 'CIV',
        expiryDate: this.convertToISOString(licenseExpiryDate),
        deliveryDate: this.convertToISOString(licenseDeliveryDate),
        driverPhoneNumber: phoneNumber,
      })
      return driverLicenseInfo.id
    } catch (error) {
      this.logger.error(error)
      return 0
    }
  }

  private async getCarRegistrationData(
    responseLines: { LineText: string }[],
    whaPhoneNumber: string,
  ) {
    const immatriculationIndex = responseLines.findIndex((line) =>
      line.LineText.includes('immatriculation'),
    )
    console.log('immatriculationIndex', immatriculationIndex)
    const plateNumberIndex =
      immatriculationIndex === -1 ? 2 : immatriculationIndex + 1
    const brandIndex =
      responseLines.findIndex((line) => line.LineText.includes('Marque')) + 1
    const colorIndex =
      responseLines.findIndex((line) => line.LineText.includes('Couleur')) + 1
    const yearIndex =
      responseLines.findIndex((line) => line.LineText.includes('edition')) + 1

    const phoneNumber = await this.getDriverPhoneNumber(whaPhoneNumber)
    const plateNumber = responseLines[plateNumberIndex].LineText
    const brand = responseLines[brandIndex].LineText
    const color = responseLines[colorIndex].LineText
    const year = responseLines[yearIndex].LineText.split('-')[2]

    console.log('plateNumber', plateNumber)
    if (!this.isValidCard(plateNumber, 'CAR_REGISTRATION')) return 0

    try {
      const carInfo = await this.carInfoService.create({
        brand,
        color,
        year,
        plateNumber,
        status: 'unknown',
        code: '',
        driverPhoneNumber: phoneNumber,
      })
      return carInfo.id
    } catch (error) {
      this.logger.error(error)
      return 0
    }
  }

  private async getDriverPhoneNumber(whaPhoneNumber: string): Promise<string> {
    return (
      await this.conversationService.findManyByWhaPhoneNumber(whaPhoneNumber)
    ).find((conv) => conv.step.level === 2 && conv.step.flowId === 1).message
  }

  private convertToISOString(dateString: string): string {
    const [day, month, year] = dateString
      .split('-')
      .map((part) => parseInt(part, 10))

    const date = new Date(year, month - 1, day)

    return date.toISOString()
  }

  private isValidCard(input: string, type: DocumentType): boolean {
    const hasLetters = /[A-Z]/.test(input)

    const hasDigits = /\d/.test(input)

    if (type === 'CAR_REGISTRATION') return hasLetters && hasDigits

    const hasTwoDashes = (input.match(/-/g) || []).length === 2

    return hasLetters && hasDigits && hasTwoDashes
  }
}
