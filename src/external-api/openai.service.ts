import { Injectable, Logger } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { GetOcrResponseDto } from "./dto/get-ocr-response.dto";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class OpenAIService {
  private readonly apiKey: string;
  private readonly logger = new Logger(OpenAIService.name)

  constructor(
    private readonly httpService: HttpService
  ) {
    this.apiKey = process.env.OPENAI_API_KEY
  }

  async extractDriverLicenseFront(ocrData: GetOcrResponseDto): Promise<any> {
    try {
      const systemPrompt = `
        Tu es un expert en extraction de données de permis de conduire ivoirien.
        Analyse le texte brut fourni par l'OCR et extrait uniquement les informations suivantes au format JSON:
        - licenseNumber: numéro du permis de conduire
        - lastName: nom de famille du chauffeur
        - firstName: prénom du chauffeur
        - deliveryDate: date de délivrance (au format YYYY-MM-DD)
        - deliveryPlace: lieu de délivrance
        
        Si une information n'est pas trouvée, renvoie null pour ce champ.
        Les dates doivent être converties au format YYYY-MM-DD.
        Assure-toi que les noms sont correctement formatés (première lettre en majuscule).
      `;
      
      return await this.makeOpenAiRequest(systemPrompt, ocrData);
    } catch (error) {
      this.logger.error(`Error extracting driver license front data: ${error.message}`);
      return null;
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
      `;
      
      return await this.makeOpenAiRequest(systemPrompt, ocrData);
    } catch (error) {
      this.logger.error(`Error extracting driver license back data: ${error.message}`);
      return null;
    }
  }

  async extractVehicleRegistration(ocrData: GetOcrResponseDto): Promise<any> {
    try {
      const systemPrompt = `
        Tu es un expert en extraction de données de carte grise ivoirienne.
        Analyse le texte brut fourni par l'OCR et extrait uniquement les informations suivantes au format JSON:
        - plateNumber: numéro d'immatriculation
        - brand: marque du véhicule
        - genre: genre du véhicule
        - firstRegistrationDate: date de première mise en circulation (au format YYYY-MM-DD)
        
        Si une information n'est pas trouvée, renvoie null pour ce champ.
        Les dates doivent être converties au format YYYY-MM-DD.
        Le numéro d'immatriculation doit être au format standard (par exemple: 1234 AB 01).
      `;
      
      return await this.makeOpenAiRequest(systemPrompt, ocrData);
    } catch (error) {
      this.logger.error(`Error extracting vehicle registration data: ${error.message}`);
      return null;
    }
  }

  private async makeOpenAiRequest(systemPrompt: string, ocrData: GetOcrResponseDto): Promise<any> {
    const response = await lastValueFrom(
      this.httpService.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Extrait le texte suivant du OCR: ${JSON.stringify(ocrData.ParsedResults[0].ParsedText)}` }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      )
    );

    return JSON.parse(response.data.choices[0].message.content);
  }
}