export enum OcrErrorCode {
  SUCCESS = 1,
  LOW_CONFIDENCE = 0,
  DUPLICATE_LICENSE = -2,
  DUPLICATE_PLATE = -3,
  ALREADY_ASSOCIATED = -1,
}

// config.ts

const env = process.env.APP_ENV || 'test'
const isProduction = env === 'prod'

export const config = {
  env,
  isProduction,

  server: {
    baseUrl: process.env.SERVER_IP_ADDRESS || 'localhost',
    appPort: isProduction
      ? process.env.APP_PORT_HOST_PROD || '3201'
      : process.env.APP_PORT_HOST_TEST || '3101',
  },

  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: isProduction
      ? process.env.DB_PORT_HOST_PROD || '5436'
      : process.env.DB_PORT_HOST_TEST || '5435',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME,
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL,
    port: isProduction
      ? process.env.RABBITMQ_PORT_HOST_PROD || '5676'
      : process.env.RABBITMQ_PORT_HOST_TEST || '5675',
    mgmtPort: isProduction
      ? process.env.RABBITMQ_MGMT_PORT_HOST_PROD || '15676'
      : process.env.RABBITMQ_MGMT_PORT_HOST_TEST || '15675',
  },
}

// Export pour usage simple
export const baseUrl = config.server.baseUrl
export const rabbitmqPort = config.rabbitmq.port

export const OpenAIConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o', // ou 'gpt-3.5-turbo' si tu veux économiser
}

// Fonction helper pour générer les messages d'erreur appropriés
export const getOcrErrorMessage = (
  documentType: string,
  errorCode: OcrErrorCode,
): string => {
  const isLicense = documentType === 'DRIVER_LICENSE'
  const docName = isLicense ? 'permis de conduire' : 'carte grise'

  switch (errorCode) {
    case OcrErrorCode.LOW_CONFIDENCE:
      return `Veuillez vérifier l'image fournie. Elle pourrait être floue ou ne pas correspondre à ${isLicense ? 'un' : 'une'} ${docName}.\nMerci de bien vouloir la corriger ou en envoyer une nouvelle.`

    case OcrErrorCode.DUPLICATE_LICENSE:
      return `Ce numéro de permis de conduire est déjà enregistré dans notre système.\nSi vous pensez qu'il s'agit d'une erreur, veuillez contacter notre support.`

    case OcrErrorCode.DUPLICATE_PLATE:
      return `Ce numéro d'immatriculation est déjà enregistré dans notre système pour un autre conducteur.\nSi vous pensez qu'il s'agit d'une erreur, veuillez contacter notre support.`

    case OcrErrorCode.ALREADY_ASSOCIATED:
      return `Vous êtes déjà associé à ce véhicule.\nMerci d'envoyer la photo de la carte grise du nouveau véhicule.`

    default:
      return `Une erreur est survenue lors du traitement de votre ${docName}.\nMerci de réessayer.`
  }
}
