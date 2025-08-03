import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { RequestStatus } from '@prisma/client'
import { lastValueFrom } from 'rxjs'
import { v4 as uuidv4 } from 'uuid'
import { RequestLogService } from '../request-log/request-log.service'
import { CreateYangoCarDto } from './dto/create-yango-car.dto'
import { CreateYangoProfileDto } from './dto/create-yango-profile.dto'
import { UpdateYangoDriverInfoDto } from './dto/update-yango-driver-info.dto'

@Injectable()
export class YangoService {
  private readonly PROFILE_PATH: string
  private readonly CAR_PATH: string
  constructor(
    private readonly httpService: HttpService,
    private readonly requestLog: RequestLogService,
  ) {
    this.PROFILE_PATH = 'contractors/driver-profile'
    this.CAR_PATH = 'vehicles/car'
  }

  async createProfile(
    _payload: CreateYangoProfileDto,
  ): Promise<{ status: number; contractor_profile_id: string }> {
    try {
      console.log('Creating Yango profile with payload:', _payload)
      const response = await lastValueFrom(
        this.httpService.post(
          `${process.env.YANGO_API_URL}/${this.PROFILE_PATH}`,
          _payload,
          {
            headers: {
              'X-API-Key': process.env.YANGO_API_KEY,
              'X-Idempotency-Token': uuidv4(),
              'X-Park-ID': process.env.YANGO_PARK_ID,
              'X-Client-ID': process.env.YANGO_CLIENT_ID,
              accept: 'application/json',
              'content-type': 'application/json',
            },
            timeout: 15000,
          },
        ),
      )

      // Validate response structure
      const data = response.data
      if (!data || !data.contractor_profile_id) {
        throw new Error('Invalid response format from Yango API')
      }

      await this.logRequest(RequestStatus.SUCCESS, _payload, response.data)
      // Return the contractor_profile_id with HTTP status from response
      return {
        status: response.status, // HTTP status code (200)
        contractor_profile_id: data.contractor_profile_id,
      }
    } catch (error) {
      // Re-throw with more context if needed
      await this.logRequest(RequestStatus.FAIL, _payload, error)
      if (error.response) {
        // HTTP error response
        throw new Error(
          `Yango API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        )
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        throw new Error('Yango API request timeout')
      } else {
        // Other errors (network, parsing, etc.)
        throw new Error(`Profile creation failed: ${error.message}`)
      }
    }
  }

  async createCar(
    _payload: CreateYangoCarDto,
  ): Promise<{ status: number; vehicle_id: string }> {
    try {
      console.log('Creating car with payload:', _payload)
      const response = await lastValueFrom(
        this.httpService.post(
          `${process.env.YANGO_API_URL}/${this.CAR_PATH}`,
          _payload,
          {
            headers: {
              'X-API-Key': process.env.YANGO_API_KEY,
              'X-Idempotency-Token': uuidv4(),
              'X-Park-ID': process.env.YANGO_PARK_ID,
              'X-Client-ID': process.env.YANGO_CLIENT_ID,
              accept: 'application/json',
              'content-type': 'application/json',
            },
            timeout: 15000,
          },
        ),
      )

      console.log('Car creation response:', response)
      // Validate response structure
      const data = response.data
      if (!data || !data.vehicle_id) {
        throw new Error('Invalid response format from Yango API')
      }
      await this.logRequest(RequestStatus.SUCCESS, _payload, response.data)
      // Return the contractor_profile_id with HTTP status from response
      return {
        status: response.status, // HTTP status code (200)
        vehicle_id: data.vehicle_id,
      }
    } catch (error) {
      // Re-throw with more context if needed
      await this.logRequest(RequestStatus.FAIL, _payload, error)
      if (error.response) {
        // HTTP error response
        throw new Error(
          `Yango API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        )
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        throw new Error('Yango API request timeout')
      } else {
        // Other errors (network, parsing, etc.)
        throw new Error(`Profile creation failed: ${error.message}`)
      }
    }
  }

  async getDriverProfile(
    contractor_profile_id: string,
  ): Promise<UpdateYangoDriverInfoDto> {
    try {
      console.log('Fetching driver profile for ID:', contractor_profile_id)
      const response = await lastValueFrom(
        this.httpService.get(
          `${process.env.YANGO_API_URL}/${this.PROFILE_PATH}?${contractor_profile_id}`,
          {
            headers: {
              'X-API-Key': process.env.YANGO_API_KEY,
              'X-Idempotency-Token': uuidv4(),
              'X-Park-ID': process.env.YANGO_PARK_ID,
              'X-Client-ID': process.env.YANGO_CLIENT_ID,
              accept: 'application/json',
              'content-type': 'application/json',
            },
            timeout: 15000,
          },
        ),
      )
      console.log('Driver profile response:', response)
      // Validate response structure
      const data = response.data
      if (!data) {
        throw new Error('Invalid response format from Yango API')
      }
      await this.logRequest(
        RequestStatus.SUCCESS,
        { contractor_profile_id },
        response.data,
      )
      // Return the contractor_profile_id with HTTP status from response
      return data as UpdateYangoDriverInfoDto
    } catch (error) {
      // Re-throw with more context if needed
      await this.logRequest(
        RequestStatus.FAIL,
        { contractor_profile_id },
        error,
      )
      if (error.response) {
        // HTTP error response
        throw new Error(
          `Yango API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        )
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        throw new Error('Yango API request timeout')
      } else {
        // Other errors (network, parsing, etc.)
        throw new Error(`Profile creation failed: ${error.message}`)
      }
    }
  }

  async updateDriverPhone(
    contractor_profile_id: string,
    payload: UpdateYangoDriverInfoDto,
  ): Promise<number> {
    try {
      const response = await lastValueFrom(
        this.httpService.put(
          `${process.env.YANGO_API_URL}/${this.PROFILE_PATH}?${contractor_profile_id}`,
          payload,
          {
            headers: {
              'X-API-Key': process.env.YANGO_API_KEY,
              'X-Idempotency-Token': uuidv4(),
              'X-Park-ID': process.env.YANGO_PARK_ID,
              'X-Client-ID': process.env.YANGO_CLIENT_ID,
              accept: 'application/json',
              'content-type': 'application/json',
            },
            timeout: 15000,
          },
        ),
      )
      await this.logRequest(
        RequestStatus.SUCCESS,
        { contractor_profile_id, payload },
        response.data,
      )
      console.log('Update driver phone response:', response)
      return response.status
    } catch (error) {
      await this.logRequest(
        RequestStatus.FAIL,
        { contractor_profile_id, payload },
        error,
      )
      console.error('Error updating driver phone:', error)
      if (error.response) {
        throw new Error(
          `Yango API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        )
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Yango API request timeout')
      } else {
        throw new Error(`Update failed: ${error.message}`)
      }
    }
  }

  async bindingDriverToCar(
    contractor_profile_id: string,
    yango_vehicle_id: string,
  ): Promise<number> {
    const parkId = process.env.YANGO_PARK_ID
    console.log('Binding driver to car with IDs:', {
      contractor_profile_id,
      yango_vehicle_id,
      parkId,
    })
    try {
      const response = await lastValueFrom(
        this.httpService.put(
          `https://fleet.api.yango.com/v1/parks/driver-profiles/car-bindings?driver_profile_id=${contractor_profile_id}&car_id=${yango_vehicle_id}&park_id=${parkId}`,
          {},
          {
            headers: {
              'X-API-Key': process.env.YANGO_API_KEY,
              'X-Idempotency-Token': uuidv4(),
              'X-Client-ID': process.env.YANGO_CLIENT_ID,
              // 'X-Park-ID': process.env.YANGO_PARK_ID,
              accept: 'application/json',
              'content-type': 'application/json',
            },
            timeout: 15000,
          },
        ),
      )
      await this.logRequest(
        RequestStatus.SUCCESS,
        {
          driver_profile_id: contractor_profile_id,
          car_id: yango_vehicle_id,
          park_id: parkId,
        },
        response.data,
      )
      console.log('Update driver phone response:', response)
      return response.status
    } catch (error) {
      await this.logRequest(
        RequestStatus.FAIL,
        {
          driver_profile_id: contractor_profile_id,
          car_id: yango_vehicle_id,
          park_id: parkId,
        },
        error,
      )
      console.error('Error binding driver to car:', error)
      if (error.response) {
        throw new Error(
          `Yango API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        )
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Yango API request timeout')
      } else {
        throw new Error(`Binding failed: ${error.message}`)
      }
    }
  }

  private async logRequest(status: RequestStatus, data: any, response: any) {
    await this.requestLog.create({
      direction: 'OUT',
      initiator: 'YANGO',
      data: JSON.stringify(data),
      response: JSON.stringify(response),
      status,
    })
  }
}
