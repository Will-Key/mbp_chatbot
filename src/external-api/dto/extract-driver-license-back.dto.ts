export class ExtractDriverLicenseBackDto {
  categories: {
    categorie: string
    dateDeValidite: string
    dateExpiration: string
  }[]
  documentIdentite: string
  groupeSanguin: string
}
