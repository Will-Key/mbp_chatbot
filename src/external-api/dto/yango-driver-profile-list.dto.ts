export class YangoDriverProfileListItemDto {
  car: {
    id: string
    brand: string
    model: string
    color: string
    year: number
    number: string
    normalized_number: string
    callsign: string
    category: string[]
    status: string
  }
  driver_profile: {
    id: string
    first_name: string
    last_name: string
    phones: string[]
    driver_license: {
      country: string
      expiration_date: string
      issue_date: string
      number: string
    }
    work_status: string
  }
}

export class YangoDriverProfileListResponseDto {
  limit: number
  offset: number
  total: number
  driver_profiles: YangoDriverProfileListItemDto[]
}
