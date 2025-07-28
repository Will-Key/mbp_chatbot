class OrderProvide {
  partner: boolean = true
  platform: boolean = true
}

class ContactInfo {
  phone: string
}

class Person {
  contact_info: ContactInfo
  driver_license: DriverLicense
  full_name: DriverInfo
}

class DriverLicense {
  country: string = 'civ'
  expiry_date: string
  issue_date: string
  number: string
}

class DriverInfo {
  first_name: string
  last_name: string
}

class Account {
  balance_limit: string
  work_rule_id: string
}

class Profile {
  hire_date: string = new Date().toISOString()
}

export class CreateYangoProfileDto {
  order_provider: OrderProvide
  person: Person
  profile: Profile
  account: Account
  carId: string
}
