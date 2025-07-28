class ParkProfile {
  callsign: string
  fuel_type: 'petrol' | 'methane' | 'propane' | 'electricity'
  status: 'unknown'
  categories: string[]
}

class VehicleLicenses {
  licence_plate_number: string
}

class VehicleSpecifications {
  brand: string
  color: string //"Белый" | "Желтый" | "Бежевый" | "Черный" | "Голубой" | "Серый" | "Красный" | "Оранжевый" | "Синий" | "Зеленый" | "Коричневый" | "Фиолетовый" | "Розовый"
  model: string
  transmission: 'mechanical' | 'automatic' | 'robotic' | 'variator'
  year: number
}

export class CreateYangoCarDto {
  park_profile: ParkProfile
  vehicle_licenses: VehicleLicenses
  vehicle_specifications: VehicleSpecifications
}
