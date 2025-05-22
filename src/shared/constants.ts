export const baseUrl =
  process.env.NODE_ENV === 'production' ? '69.62.125.181' : 'localhost'

export const rabbitmqPort = '5674'

export const OpenAIConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o', // ou 'gpt-3.5-turbo' si tu veux économiser
};