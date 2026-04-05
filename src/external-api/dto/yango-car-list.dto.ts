export class YangoCarListItemDto {
  id: string
  brand: string
  model: string
  color: string
  year: number
  number: string
  normalized_number: string
  status: string
  callsign: string
  category: string[]
}

export class YangoCarListResponseDto {
  limit: number
  offset: number
  total: number
  cars: YangoCarListItemDto[]
}
