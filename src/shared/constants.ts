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
