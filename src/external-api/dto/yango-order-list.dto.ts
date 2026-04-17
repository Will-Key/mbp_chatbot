export class YangoOrderAddressDto {
  address: string
  lat: number
  lon: number
}

export class YangoOrderRoutePointDto {
  address: string
  lat: number
  lon: number
}

export class YangoOrderEventDto {
  event_at: string
  order_status: string
}

export class YangoOrderDriverProfileDto {
  id: string
  name: string
}

export class YangoOrderCarDto {
  id: string
  brand_model: string
  license: {
    number: string
  }
  callsign: string
}

export class YangoOrderDto {
  id: string
  short_id: number
  status: string
  created_at: string
  booked_at: string
  provider: string
  category: string
  address_from: YangoOrderAddressDto
  route_points: YangoOrderRoutePointDto[]
  events: YangoOrderEventDto[]
  ended_at?: string
  payment_method: string
  driver_profile: YangoOrderDriverProfileDto
  car: YangoOrderCarDto
  price: string
  cancellation_description?: string
}

export class YangoOrderListResponseDto {
  orders: YangoOrderDto[]
}
