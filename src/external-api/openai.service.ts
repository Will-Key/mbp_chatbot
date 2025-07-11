import { Injectable, Logger } from '@nestjs/common'
import { lastValueFrom } from 'rxjs'
import { GetOcrResponseDto } from './dto/get-ocr-response.dto'
import { HttpService } from '@nestjs/axios'
import { ExtractDriverLicenseFrontDto } from './dto/extract-driver-license-front.dto'
import { ExtractVehiculeRegistrationDto } from './dto/extract-vehicule-registration.dto'

@Injectable()
export class OpenAIService {
  private readonly apiKey: string
  private readonly logger = new Logger(OpenAIService.name)

  constructor(private readonly httpService: HttpService) {
    this.apiKey = process.env.OPENAI_API_KEY
  }

  async extractDriverLicenseFront(
    ocrData: GetOcrResponseDto,
  ): Promise<ExtractDriverLicenseFrontDto> {
    try {
      const systemPrompt = `
        Tu es un expert en extraction de données de permis de conduire ivoirien.
        Analyse le texte brut fourni par l'OCR et extrait uniquement les informations suivantes au format JSON:
        - imageType: doit contenir "PERMIS DE CONDUIRE"
        - licenseNumber: numéro du permis de conduire
        - lastName: nom de famille du chauffeur
        - firstName: prénom du chauffeur
        - deliveryDate: date de délivrance (au format YYYY-MM-DD)
        - deliveryPlace: lieu de délivrance
        - percentage: le pourcentage d'information récupéré sans rajouter le signe % en te basant sur les propriétés précédentes.
        
        Si une information n'est pas trouvée, renvoie null pour ce champ mais toute fois tient compte des erreurs des libellés des informations à récupérer.
        Les dates doivent être converties au format YYYY-MM-DD.
        Assure-toi que les noms sont correctement formatés (première lettre en majuscule).
      `

      return await this.makeOpenAiRequest(systemPrompt, ocrData)
    } catch (error) {
      this.logger.error(
        `Error extracting driver license front data: ${error.message}`,
      )
      return null
    }
  }

  async extractDriverLicenseBack(ocrData: GetOcrResponseDto): Promise<any> {
    try {
      const systemPrompt = `
        Tu es un expert en extraction de données du verso du permis de conduire ivoirien.
        Analyse le texte brut fourni par l'OCR et extrait uniquement les informations suivantes au format JSON:
        - expiryDate: date d'expiration (au format YYYY-MM-DD)
        
        Si l'information n'est pas trouvée, renvoie null pour ce champ.
        Les dates doivent être converties au format YYYY-MM-DD.
      `

      return await this.makeOpenAiRequest(systemPrompt, ocrData)
    } catch (error) {
      this.logger.error(
        `Error extracting driver license back data: ${error.message}`,
      )
      return null
    }
  }

  async extractVehicleRegistration(
    ocrData: GetOcrResponseDto,
  ): Promise<ExtractVehiculeRegistrationDto> {
    try {
      const systemPrompt = `
        Tu es un expert en extraction de données de carte grise ivoirienne.
        Analyse le texte brut fourni par l'OCR et extrait uniquement les informations suivantes au format JSON:
        - plateNumber: numéro d'immatriculation
        - brand: marque du véhicule
        - model: Type commercial
        - color: couleur du véhicule (retourne la couleur récupérer en russe entre ces valeurs "Белый" | "Желтый" | "Бежевый" | "Черный" | "Голубой" | "Серый" | "Красный" | "Оранжевый" | "Синий" | "Зеленый" | "Коричневый" | "Фиолетовый" | "Розовый")
        - firstRegistrationDate: date de première mise en circulation (au format YYYY-MM-DD)
        - percentage: le pourcentage d'information récupéré sans rajouter le signe % en te basant sur les propriétés précédentes.
        
        Si une information n'est pas trouvée, renvoie null pour ce champ.
        Les dates doivent être converties au format YYYY-MM-DD.
        Le numéro d'immatriculation doit être au format standard (par exemple: 1234 AB 01).
      `

      return await this.makeOpenAiRequest(systemPrompt, ocrData)
    } catch (error) {
      this.logger.error(
        `Error extracting vehicle registration data: ${error.message}`,
      )
      return null
    }
  }

  private async makeOpenAiRequest(
    systemPrompt: string,
    ocrData: GetOcrResponseDto,
  ): Promise<any> {
    const response = await lastValueFrom(
      this.httpService.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Extrait le texte suivant du OCR: ${JSON.stringify(ocrData.ParsedResults[0].ParsedText)}`,
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      ),
    )
    console.log('makeOpenAiRequest', response)
    return JSON.parse(response.data.choices[0].message.content)
  }
}
