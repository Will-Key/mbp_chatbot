import { Injectable, Logger } from '@nestjs/common'
import { DocumentFile } from '@prisma/client'
import { addYears } from 'date-fns'
import { ocrSpace } from 'ocr-space-api-wrapper'
import { CarInfoService } from '../car-info/car-info.service'
import { ConversationService } from '../conversation/conversation.service'
import { DriverCarService } from '../driver-car/driver-car.service'
import { DriverLicenseInfoService } from '../driver-license-info/driver-license-info.service'
import { DriverPersonalInfoService } from '../driver-personal-info/driver-personal-info.service'
import { RequestLogService } from '../request-log/request-log.service'
import { OcrErrorCode } from '../shared/constants'
import { ExtractDriverLicenseFrontDto } from './dto/extract-driver-license-front.dto'
import { ExtractVehiculeRegistrationDto } from './dto/extract-vehicule-registration.dto'
import { GetOcrResponseDto } from './dto/get-ocr-response.dto'
import { SendDocDto } from './dto/send-doc.dto'
import { OpenAIService } from './openai.service'

@Injectable()
export class OcrSpaceService {
  private readonly logger = new Logger(OcrSpaceService.name)

  constructor(
    private readonly requestLogService: RequestLogService,
    private readonly conversationService: ConversationService,
    private readonly driverPersonalInfoService: DriverPersonalInfoService,
    private readonly driverLicenseInfoService: DriverLicenseInfoService,
    private readonly carInfoService: CarInfoService,
    private readonly openAiService: OpenAIService,
    private readonly driverCarService: DriverCarService,
  ) {}

  async sendFile(file: DocumentFile, idFlow: string) {
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
      this.logger.log(`ocrSpace response:`, JSON.stringify(response))
      if (response.ParsedResults.length === 0) {
        await this.requestLogService.create({
          direction: 'OUT',
          status: 'FAIL',
          initiator: 'OCR_SPACE',
          data: file.dataImageUrl,
          response: JSON.stringify(response),
        })
        return OcrErrorCode.OCR_SERVICE_ERROR
      }
      const ocrResponse = await this.processOcrResponse(response, file, idFlow)

      await this.requestLogService.create({
        direction: 'OUT',
        status: 'SUCCESS',
        initiator: 'OCR_SPACE',
        data: file.dataImageUrl,
        response: JSON.stringify(response),
      })
      console.log('ocrResponse', ocrResponse)
      return ocrResponse
    } catch (error) {
      this.logger.log(`ocrSpace error: ${error}`)
      await this.requestLogService.create({
        direction: 'OUT',
        status: 'FAIL',
        initiator: 'OCR_SPACE',
        data: file.dataImageUrl,
        response: JSON.stringify(error),
      })
      return 0
    }
  }

  private async processOcrResponse(
    response: GetOcrResponseDto,
    file: DocumentFile,
    idFlow: string,
  ) {
    console.log('file.documentType', file.documentType)
    if (
      file.documentType === 'DRIVER_LICENSE' &&
      file.documentSide === 'FRONT'
    ) {
      const driverLicenseInfo =
        await this.openAiService.extractDriverLicenseFront(response)

      if (+driverLicenseInfo.percenrtage < 80)
        return OcrErrorCode.LOW_CONFIDENCE

      // Vérifier l'unicité du numéro de permis avant de créer
      const existingLicense = await this.driverPersonalInfoService
        .findByLicenseNumber(driverLicenseInfo.licenseNumber)
        .catch(() => null)

      if (existingLicense) {
        return OcrErrorCode.DUPLICATE_LICENSE
      }

      const existingPhone = await this.driverPersonalInfoService
        .findDriverPersonalInfoByPhoneNumber(
          await this.getDriverPhoneNumber(file.whaPhoneNumber, idFlow),
        )
        .catch(() => null)

      if (existingPhone) {
        return OcrErrorCode.DUPLICATE_PHONE
      }

      const licenseInfo =
        await this.driverLicenseInfoService.findLicenseInfoByPhoneNumber(
          await this.getDriverPhoneNumber(file.whaPhoneNumber, idFlow),
        )

      if (licenseInfo) {
        return OcrErrorCode.DUPLICATE_PHONE
      }

      const result = await this.getDriverLicenseFrontData(
        driverLicenseInfo,
        file.whaPhoneNumber,
        idFlow,
      )

      return result > 0 ? OcrErrorCode.SUCCESS : OcrErrorCode.LOW_CONFIDENCE
    }
    if (
      file.documentType === 'DRIVER_LICENSE' &&
      file.documentSide === 'BACK'
    ) {
      const driverLicenseBackInfo =
        await this.openAiService.extractDriverLicenseBack(response)
      console.log('driverLicenseBackInfo', driverLicenseBackInfo)

      const driverPhoneNumber = await this.getDriverPhoneNumber(
        file.whaPhoneNumber,
        'Inscription',
      )
      console.log('driverPhoneNumber', driverPhoneNumber)

      const { id } =
        await this.driverLicenseInfoService.findLicenseInfoByPhoneNumber(
          driverPhoneNumber,
        )
      console.log('driverLicenseInfo id', id)
      const licenseBackInfo = await this.driverLicenseInfoService.update(id, {
        backInfo: JSON.stringify(driverLicenseBackInfo),
      })
      console.log('licenseBackInfo', licenseBackInfo)

      return licenseBackInfo.id
        ? OcrErrorCode.SUCCESS
        : OcrErrorCode.LOW_CONFIDENCE
    }

    if (file.documentType === 'CAR_REGISTRATION') {
      const vehiculeInfo =
        await this.openAiService.extractVehicleRegistration(response)

      if (+vehiculeInfo.percentage < 80) return OcrErrorCode.LOW_CONFIDENCE

      // Vérifier si le véhicule est déjà associé à CE conducteur
      const phoneNumber = await this.getDriverPhoneNumber(
        file.whaPhoneNumber,
        idFlow,
      )
      const idDriver = (
        await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
          phoneNumber,
        )
      ).id

      // TODO: retirer les tirets et espaces du numéro de plaque pour la comparaison
      const normalizedPlateNumber = vehiculeInfo.plateNumber.replace(
        /[-\s]/g,
        '',
      )

      const existingCar = await this.carInfoService
        .findByPlateNumber(vehiculeInfo.plateNumber, normalizedPlateNumber)
        .catch(() => null)

      if (existingCar) {
        // Vérifier si ce véhicule est ACTUELLEMENT associé à ce conducteur (endDate = '9999-12-31')
        const currentAssociation = await this.driverCarService
          .findOneByDriverIdAndCarId(idDriver, existingCar.id)
          .catch(() => null)

        // Si le véhicule est déjà activement associé à ce conducteur, c'est une erreur
        if (currentAssociation && currentAssociation.endDate === null) {
          return OcrErrorCode.ALREADY_ASSOCIATED
        }

        // Sinon, le véhicule existe mais peut être réutilisé (ancien véhicule ou d'un autre conducteur)
      }

      const result = await this.getCarRegistrationData(
        vehiculeInfo,
        file.whaPhoneNumber,
        idFlow,
      )

      if (result === -1) return OcrErrorCode.ALREADY_ASSOCIATED
      return result > 0 ? OcrErrorCode.SUCCESS : OcrErrorCode.LOW_CONFIDENCE
    }

    return OcrErrorCode.LOW_CONFIDENCE
  }

  private async getDriverLicenseFrontData(
    {
      lastName,
      firstName,
      licenseNumber,
      deliveryDate,
    }: ExtractDriverLicenseFrontDto,
    whaPhoneNumber: string,
    idFlow: string,
  ) {
    const phoneNumber = await this.getDriverPhoneNumber(whaPhoneNumber, idFlow)
    try {
      const driverPersonalInfo = await this.driverPersonalInfoService.create({
        lastName,
        firstName,
        phoneNumber,
        whaPhoneNumber,
        licenseNumber,
        collectMethod: 'OCR',
      })
      console.log('driverPersonalInfo', driverPersonalInfo?.id)
      await this.driverLicenseInfoService.create({
        countryCode: 'CIV',
        expiryDate: addYears(deliveryDate, 10).toISOString(),
        deliveryDate: this.convertToISOString(deliveryDate),
        driverPhoneNumber: phoneNumber,
        idDriverPersInfo: driverPersonalInfo?.id,
      })

      return driverPersonalInfo.id
    } catch (error) {
      this.logger.error(error)
      return 0
    }
  }

  private async getCarRegistrationData(
    {
      brand,
      plateNumber,
      color,
      model,
      firstRegistrationDate,
    }: ExtractVehiculeRegistrationDto,
    whaPhoneNumber: string,
    idFlow: string,
  ) {
    const phoneNumber = await this.getDriverPhoneNumber(whaPhoneNumber, idFlow)
    const idDriver = (
      await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
        phoneNumber,
      )
    ).id
    console.log('idDriver', idDriver)
    console.log('phoneNumber', phoneNumber)

    try {
      let carId = (await this.carInfoService.findByPlateNumber(plateNumber))?.id
      console.log('carInfo', carId)
      console.log('plateNumber', plateNumber)

      if (!carId) {
        carId = (
          await this.carInfoService.create({
            brand,
            color,
            year: firstRegistrationDate.split('-')[0],
            plateNumber,
            code: plateNumber,
            model,
            status: 'working',
          })
        ).id
      }

      const associatedCar =
        await this.driverCarService.findOneByDriverIdAndCarId(idDriver, carId)
      console.log('associatedCar', associatedCar)
      if (associatedCar) return OcrErrorCode.ALREADY_ASSOCIATED // Indicates that the car already exists for this driver

      if (idFlow === 'Changement de véhicule') {
        await this.driverCarService.updateEndDateByDriverId(idDriver)
      }

      await this.driverCarService.create({
        idDriver,
        idCar: carId,
      })

      return carId
    } catch (error) {
      const driverLastAssociation =
        await this.driverCarService.findDriverLastAssociation(idDriver)
      await this.driverCarService.remove(driverLastAssociation.id)

      await this.carInfoService.remove(driverLastAssociation.idCar)

      const { id: recentAssociationId, idCar: recentIdCar } =
        await this.driverCarService.findDriverMostRecentAssociation(idDriver)
      if (recentAssociationId) {
        await this.driverCarService.update(recentAssociationId, {
          idCar: recentIdCar,
          endDate: null,
        })
      }

      this.logger.error(error)
      return 0
    }
  }

  private async getDriverPhoneNumber(
    whaPhoneNumber: string,
    idFlow: string,
  ): Promise<string> {
    return (
      await this.conversationService.findManyByWhaPhoneNumber(whaPhoneNumber)
    ).find((conv) => conv.step.level === 2 && conv.step.flow.idFlow === idFlow)
      .message
    // return flowId === 1
    //   ? (
    //       await this.conversationService.findManyByWhaPhoneNumber(
    //         whaPhoneNumber,
    //       )
    //     ).find((conv) => conv.step.level === 2 && conv.step.flowId === flowId)
    //       .message
    //   : (
    //       await this.conversationService.findManyByWhaPhoneNumber(
    //         whaPhoneNumber,
    //       )
    //     ).find((conv) => conv.step.level === 2 && conv.step.flowId === flowId)
    //       .message
  }

  private convertToISOString(dateString: string): string {
    const [year, month, day] = dateString
      .split('-')
      .map((part) => parseInt(part, 10))

    const date = new Date(year, month - 1, day)

    return date.toISOString()
  }
}
