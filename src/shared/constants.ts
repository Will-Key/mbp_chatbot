export const baseUrl = process.env.SERVER_IP_ADDRESS || 'localhost'

export const rabbitmqPort = '5674'

export const OpenAIConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o', // ou 'gpt-3.5-turbo' si tu veux économiser
}
