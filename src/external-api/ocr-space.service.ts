import { Injectable, Logger } from '@nestjs/common'
import { DocumentFile, DocumentType } from '@prisma/client'
import { RequestLogService } from '../request-log/request-log.service'
import { ocrSpace } from 'ocr-space-api-wrapper'
import { SendDocDto } from './dto/send-doc.dto'
import { GetOcrResponseDto } from './dto/get-ocr-response.dto'
import { ConversationService } from '../conversation/conversation.service'
import { DriverPersonalInfoService } from '../driver-personal-info/driver-personal-info.service'
import { DriverLicenseInfoService } from '../driver-license-info/driver-license-info.service'
import { CarInfoService } from '../car-info/car-info.service'
import { OpenAIService } from './openai.service'
import { ExtractDriverLicenseFrontDto } from './dto/extract-driver-license-front.dto'
import { addYears } from 'date-fns'
import { ExtractVehiculeRegistrationDto } from './dto/extract-vehicule-registration.dto'

@Injectable()
export class OcrSpaceService {
  private readonly logger = new Logger(OcrSpaceService.name)

  constructor(
    private readonly requestLogService: RequestLogService,
    private readonly conversationService: ConversationService,
    private readonly driverPersonalInfoService: DriverPersonalInfoService,
    private readonly driverLicenseInfoService: DriverLicenseInfoService,
    private readonly carInfoService: CarInfoService,
    private readonly openAiService: OpenAIService
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
    
    if (file.documentType === 'DRIVER_LICENSE') {
      const driverLicenseInfo = await this.openAiService.extractDriverLicenseFront(response)

      if(+driverLicenseInfo.percenrtage < 80) return 0

      return await this.getDriverLicenseFrontData(driverLicenseInfo, file.whaPhoneNumber)
    } else {
      const vehiculeInfo = await this.openAiService.extractVehicleRegistration(response)

      if(+vehiculeInfo.percentage < 80) return 0

      return await this.getCarRegistrationData(vehiculeInfo, file.whaPhoneNumber)
    }
    
  }

  private async getDriverLicenseFrontData(
    { lastName, firstName, licenseNumber, deliveryDate}: ExtractDriverLicenseFrontDto,
    whaPhoneNumber: string,
  ) {
    const phoneNumber = await this.getDriverPhoneNumber(whaPhoneNumber)
    try {
      
      const driverPersonalInfo = await this.driverPersonalInfoService.create({
        lastName,
        firstName,
        phoneNumber,
        whaPhoneNumber,
        licenseNumber,
        collectMethod: 'OCR',
      })

      await this.driverLicenseInfoService.create({
        countryCode: 'CIV',
        expiryDate: addYears(deliveryDate, 10).toISOString(),
        deliveryDate: this.convertToISOString(deliveryDate),
        driverPhoneNumber: phoneNumber,
        idDriverPersInfo: driverPersonalInfo.id
      })
      

      return driverPersonalInfo.id
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
        idDriverPersInfo: 0
      })
      return driverLicenseInfo.id
    } catch (error) {
      this.logger.error(error)
      return 0
    }
  }

  private async getCarRegistrationData(
    { brand, plateNumber, color, genre, firstRegistrationDate }: ExtractVehiculeRegistrationDto,
    whaPhoneNumber: string,
  ) {
    const phoneNumber = await this.getDriverPhoneNumber(whaPhoneNumber)
    
    try {
      const carInfo = await this.carInfoService.create({
        brand,
        color,
        year: firstRegistrationDate.split('-')[0],
        plateNumber,
        status: 'unknown',
        code: '',
        driverPhoneNumber: phoneNumber,
      })
      console.log('carInfo', carInfo)
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
    const [year, month, day] = dateString
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
