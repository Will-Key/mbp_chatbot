class ParkProfile {
  callsign: string
  fuel_type: 'petrol' | 'methane' | 'propane' | 'electricity'
  status: 'unknown'
  categories: string[]
}

class VehiculeLicenses {
  licence_plate_number: string
}

class VehiculeSpecifications {
  brand: string
  color: string//"Белый" | "Желтый" | "Бежевый" | "Черный" | "Голубой" | "Серый" | "Красный" | "Оранжевый" | "Синий" | "Зеленый" | "Коричневый" | "Фиолетовый" | "Розовый"
  model: string
  transmission: "mechanical" | "automatic" | "robotic" | "variator"
  year: number
}

export class CreateYangoCarDto {
  park_profile: ParkProfile
  vehicule_licenses: VehiculeLicenses
  vehicule_specifications: VehiculeSpecifications
}