import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { catchError, lastValueFrom, map } from 'rxjs'
import { RequestLogService } from '../request-log/request-log.service'
import { ExtractDriverLicenseBackDto } from './dto/extract-driver-license-back.dto'
import { ExtractDriverLicenseFrontDto } from './dto/extract-driver-license-front.dto'
import { ExtractVehiculeRegistrationDto } from './dto/extract-vehicule-registration.dto'
import { GetOcrResponseDto } from './dto/get-ocr-response.dto'

@Injectable()
export class OpenAIService {
  private readonly apiKey: string
  private readonly logger = new Logger(OpenAIService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly requestLogService: RequestLogService,
  ) {
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
        - lastName: nom de famille du chauffeur (Tout en majuscule)
        - firstName: prénom du chauffeur (Tout en majuscule)
        - deliveryDate: date de délivrance (au format YYYY-MM-DD)
        - deliveryPlace: lieu de délivrance
        - percentage: le pourcentage d'information récupéré sans rajouter le signe % en te basant sur les propriétés précédentes.
        
        Si une information n'est pas trouvée, renvoie null pour ce champ mais toute fois tient compte des erreurs des libellés des informations à récupérer.
        Les dates doivent être converties au format YYYY-MM-DD.
        Assure-toi que les noms sont correctement formatés (Tout en majuscule).
        Toutes les réponses doivent être en majuscules.
      `

      return await this.makeOpenAiRequest(systemPrompt, ocrData)
    } catch (error) {
      this.logger.error(
        `Error extracting driver license front data: ${error.message}`,
      )
      return null
    }
  }

  async extractDriverLicenseBack(
    ocrData: GetOcrResponseDto,
  ): Promise<ExtractDriverLicenseBackDto> {
    try {
      // const systemPrompt = `
      //   Tu es un expert en extraction de données du verso du permis de conduire ivoirien.
      //   Analyse le texte brut fourni par l'OCR et extrait uniquement les informations suivantes au format JSON:
      //   - expiryDate: date d'expiration (au format YYYY-MM-DD)
      //   Si l'information n'est pas trouvée, renvoie null pour ce champ.
      //   Les dates doivent être converties au format YYYY-MM-DD.
      // `
      const systemPrompt = `
        Tu es un assistant qui formate le texte brut issu d'un OCR de permis de conduire.

        Règles :
        1. Extrait les catégories, les dates de validité et les dates d'expiration si elles sont présentes.
        2. Si certaines catégories ne sont pas trouvées, considère par défaut les catégories A, B, C, D et E.
        3. Les catégories A et B ont toujours comme dateExpiration "PERMANENT", même si une autre valeur est trouvée.
        4. Les dates de validité et d'expiration sont alignées avec l'ordre des catégories trouvées.
          - Si une catégorie ajoutée par défaut n'a pas de date spécifique, copie la date de validité et d'expiration de la catégorie précédente (en respectant la règle 3 pour A et B).
        5. Extrait le document d'identité.
        6. Extrait le groupe sanguin.
        7. Retourne UNIQUEMENT du JSON valide comme le format attendu, sans texte explicatif.

        Format attendu :
        {
          "categories": [
            {"categorie": "A", "dateDeValidite": "valeur", "dateExpiration": "PERMANENT"},
            {"categorie": "B", "dateDeValidite": "valeur", "dateExpiration": "PERMANENT"},
            {"categorie": "C", "dateDeValidite": "valeur", "dateExpiration": "valeur"},
            {"categorie": "D", "dateDeValidite": "valeur", "dateExpiration": "valeur"},
            {"categorie": "E", "dateDeValidite": "valeur", "dateExpiration": "valeur"}
          ],
          "documentIdentite": "valeur",
          "groupeSanguin": "valeur"
        }

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
        - brand: marque du véhicule (retourne une marque qui existe sur le marché)
        - model: Type commercial (retourne la valeur sous le format Train-Case : par exemple "Mercedes-Benz" | "S-Presso")
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
    imageLink?: string,
  ): Promise<any> {
    const response = await lastValueFrom(
      this.httpService
        .post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: ocrData
                  ? `Extrait le texte suivant du OCR: ${JSON.stringify(ocrData.ParsedResults[0].ParsedText)}`
                  : `Analyse cette image : ${imageLink} et donne moi les informations demandées au format JSON`,
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
        )
        .pipe(
          map(async (response) => {
            await this.requestLogService.create({
              direction: 'OUT',
              status: 'SUCCESS',
              initiator: 'OPENAI',
              data: ocrData
                ? JSON.stringify(ocrData.ParsedResults[0].ParsedText)
                : imageLink,
              response: `${response}`,
            })
            return response
          }),
          catchError(async (error) => {
            await this.requestLogService.create({
              direction: 'OUT',
              status: 'FAIL',
              initiator: 'OPENAI',
              data: ocrData
                ? JSON.stringify(ocrData.ParsedResults[0].ParsedText)
                : imageLink,
              response: JSON.stringify(error),
            })
            throw error
          }),
        ),
    )
    console.log('makeOpenAiRequest', response.data.choices)
    return JSON.parse(response.data.choices[0].message.content)
  }
}
