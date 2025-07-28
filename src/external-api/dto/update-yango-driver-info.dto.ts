class Account {
  balance_limit: string
  payment_service_id: string
  work_rule_id: string
}

class OrderProvider {
  partner: boolean
  platform: boolean
}

class ContactInfo {
  phone: string
}

class DriverLicense {
  country: string
  expiry_date: string
  issue_date: string
  number: string
}

class FullName {
  first_name: string
  last_name: string
}

class Person {
  contact_info: ContactInfo
  driver_license: DriverLicense
  full_name: FullName
}

class Profile {
  hire_date: string
  work_status: 'working' | 'not_working' | 'fired'
}

export class UpdateYangoDriverInfoDto {
  account: Account
  order_provider: OrderProvider
  person: Person
  profile: Profile
}
