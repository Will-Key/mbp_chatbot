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

  async sendFile(file: DocumentFile, flowId: number) {
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
      const ocrResponse = await this.processOcrResponse(response, file, flowId)

      await this.requestLogService.create({
        direction: 'OUT',
        status: 'SUCCESS',
        initiator: 'OCR_SPACE',
        data: file.dataImageUrl,
        response: `${response}`,
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
        response: `${error}`,
      })
      return 0
    }
  }

  private async processOcrResponse(
    response: GetOcrResponseDto,
    file: DocumentFile,
    flowId: number,
  ) {
    console.log('file.documentType', file.documentType)
    if (file.documentType === 'DRIVER_LICENSE') {
      const driverLicenseInfo =
        await this.openAiService.extractDriverLicenseFront(response)

      if (+driverLicenseInfo.percenrtage < 80) return 0

      return await this.getDriverLicenseFrontData(
        driverLicenseInfo,
        file.whaPhoneNumber,
        flowId,
      )
    } else {
      const vehiculeInfo =
        await this.openAiService.extractVehicleRegistration(response)

      if (+vehiculeInfo.percentage < 80) return 0

      return await this.getCarRegistrationData(
        vehiculeInfo,
        file.whaPhoneNumber,
        flowId,
      )
    }
  }

  private async getDriverLicenseFrontData(
    {
      lastName,
      firstName,
      licenseNumber,
      deliveryDate,
    }: ExtractDriverLicenseFrontDto,
    whaPhoneNumber: string,
    flowId: number,
  ) {
    const phoneNumber = await this.getDriverPhoneNumber(whaPhoneNumber, flowId)
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
        idDriverPersInfo: driverPersonalInfo.id,
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
    flowId: number,
  ) {
    const phoneNumber = await this.getDriverPhoneNumber(whaPhoneNumber, flowId)
    const idDriver = (
      await this.driverPersonalInfoService.findDriverPersonalInfoByPhoneNumber(
        phoneNumber,
      )
    ).id
    console.log('idDriver', idDriver)
    console.log('phoneNumber', phoneNumber)
    try {
      if (flowId === 2) {
        const carId = (await this.carInfoService.findByPlateNumber(plateNumber))
          ?.id
        console.log('carInfo', carId)
        console.log('plateNumber', plateNumber)

        if (carId) {
          const associatedCar =
            await this.driverCarService.findOneByDriverIdAndCarId(
              idDriver,
              carId,
            )
          console.log('associatedCar', associatedCar)
          if (associatedCar) return -1 // Indicates that the car already exists for this driver

          console.log('carInfo', carId)
          const lastAssociation =
            await this.driverCarService.findOneByDriverId(idDriver)

          await this.carInfoService.update(lastAssociation.idCar, {
            status: 'not_working',
          })

          await this.carInfoService.update(carId, {
            status: 'working',
          })
          await this.driverCarService.update(lastAssociation.id, {
            idDriver,
            idCar: carId,
          })
          return -2 // Don't need to create this car on Yango
        } // Return existing car ID if found

        const newCarId = (
          await this.carInfoService.create({
            brand,
            color,
            year: firstRegistrationDate.split('-')[0],
            plateNumber,
            status: 'working',
            code: plateNumber,
            model,
            //driverPhoneNumber: phoneNumber,
          })
        ).id
        console.log('newCarId', newCarId)
        const lastAssociation =
          await this.driverCarService.findOneByDriverId(idDriver)
        console.log('lastAssociation', lastAssociation)
        await this.carInfoService.update(lastAssociation.idCar, {
          status: 'not_working',
        })
        await this.driverCarService.update(lastAssociation.id, {
          idDriver,
          idCar: newCarId,
        })

        return newCarId
      } else {
        const newCarId = (
          await this.carInfoService.create({
            brand,
            color,
            year: firstRegistrationDate.split('-')[0],
            plateNumber,
            status: 'working',
            code: plateNumber,
            model,
            //driverPhoneNumber: phoneNumber,
          })
        ).id

        console.log('newCarId', newCarId)

        await this.driverCarService.create({
          idDriver,
          idCar: newCarId,
        })

        return newCarId
      }
    } catch (error) {
      const lastAdded =
        await this.carInfoService.findCarInfoByDriverPhoneNumberAndStatus(
          phoneNumber,
          'working',
        )
      await this.carInfoService.remove(lastAdded.id)
      const currentCarInfo =
        await this.carInfoService.findCarInfoByDriverPhoneNumber(phoneNumber)
      await this.carInfoService.update(currentCarInfo.id, {
        status: 'working',
      })
      await this.driverCarService.update(
        (await this.driverCarService.findOneByDriverId(idDriver)).id,
        {
          idDriver,
          idCar: currentCarInfo.id,
        },
      )
      this.logger.error(error)
      return 0
    }
  }

  private async getDriverPhoneNumber(
    whaPhoneNumber: string,
    flowId: number,
  ): Promise<string> {
    return (
      await this.conversationService.findManyByWhaPhoneNumber(whaPhoneNumber)
    ).find((conv) => conv.step.level === 2 && conv.step.flowId === flowId)
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
