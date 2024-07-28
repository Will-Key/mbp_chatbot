import { CreateStepDto } from 'src/step/dto/create-step.dto'
import { CreateFlowDto } from '../flow/dto/create-flow.dto'
import { StepExpectedResponseType } from '@prisma/client'

export const INITIAL_FLOWS: CreateFlowDto[] = [
  {
    name: 'Inscription',
  },
  {
    name: 'Association',
  },
]

export const INITIAL_STEPS: CreateStepDto[] = [
  {
    level: 0,
    message: `Merci d'avoir choisir le partenaire MBP pour vous connecter à votre compte Yango.
              \nVeuillez choisir un des services ci-après :
              \n1-	Je m'enregistre Chez le partenaire MBP
              \n2-	J'effectue le changement du véhicule associé à mon compte MBP
              \n3-	Réclamation et autres questions.
            `,
    expectedResponseType: StepExpectedResponseType.text,
    expectedResponse: '1,2,3',
    expectedResponseLength: 1,
  },
  {
    level: 1,
    message: `Pour vous enregistrer chez MBP, vous suivrez les étapes ci-après. 
              \nVous devriez entrez aux différentes étapes, les informations demandées.
              \nVeuillez entrer votre numéro de téléphone. 
            `,
    expectedResponse: '',
    expectedResponseType: StepExpectedResponseType.text,
    expectedResponseLength: 10,
    flowId: 1,
  },
  {
    level: 2,
    message: `Partager une photo lisible de votre permis en resto et verso.
            \nPartager d'abord la photo recto de votre permis.
            `,
    expectedResponse: 'data:image/png;base64',
    expectedResponseType: 'image',
    expectedResponseLength: 1,
    flowId: 1,
  },
  {
    level: 3,
    message: `Partager Ensuite le verso du permis`,
    expectedResponse: 'data:image/png;base64',
    expectedResponseType: 'image',
    expectedResponseLength: 100,
    flowId: 1,
  },
  {
    level: 4,
    message: `Partager également une photo lisible en recto verso de la carte grise du véhicule auquel vous souhaitez être associé.
            \nPartager d'abord la photo recto de la carte grise.`,
    expectedResponse: 'data:image/png;base64,',
    expectedResponseType: 'image',
    expectedResponseLength: 100,
    flowId: 1,
  },
  {
    level: 5,
    message: `Partager Ensuite la photo verso de la carte grise.`,
    expectedResponse: 'data:image/png;base64,',
    expectedResponseType: 'image',
    expectedResponseLength: 100,
    flowId: 1,
  },
  {
    level: 6,
    message: `Veuillez entrer votre nom`,
    expectedResponse: StepExpectedResponseType.text,
    expectedResponseLength: 2,
    flowId: 1,
  },
  {
    level: 7,
    message: `Veuillez entrer votre prénom`,
    expectedResponse: StepExpectedResponseType.text,
    expectedResponseLength: 2,
    flowId: 1,
  },
  {
    level: 8,
    message: `Veuillez entrer le numero de votre permis`,
    expectedResponse: 'number',
    expectedResponseLength: 15,
    flowId: 1,
  },
  {
    level: 9,
    message: `Veuillez entrer la date d'expiration`,
    expectedResponse: StepExpectedResponseType.text,
    expectedResponseLength: 8,
    flowId: 1,
  },
  {
    level: 10,
    message: `Veuillez entrer la date de délivrance`,
    expectedResponse: StepExpectedResponseType.text,
    expectedResponseLength: 8,
    flowId: 1,
  },
  {
    level: 14,
    message: `L'information renseignée n'est pas celle attendue.`,
    expectedResponse: '',
    expectedResponseLength: 0,
    flowId: 1,
  },
  {
    level: 15,
    message: `Votre inscription n'a pas pu être effectué, veuillez vous rendre dans les locaux de MBP`,
    expectedResponse: '',
    expectedResponseLength: 0,
    flowId: 1,
  },
  {
    level: 19,
    message: `Votre demande d'inscription à la plateforme MBP est terminée. Un message de confirmation suivi des instructions vous sera partagé dans moins de Cinq (05) mins.`,
    expectedResponse: '',
    expectedResponseLength: 0,
    flowId: 1,
  },
  {
    level: 1,
    message: `D'accord, nous allons mettre à jour l'association de votre véhicule. 
            \nVeuillez fournir le nom du chauffeur.`,
    expectedResponse: StepExpectedResponseType.text,
    expectedResponseLength: 2,
    flowId: 2,
  },
  {
    level: 2,
    message: `Merci ! Quelle est la plaque d'immatriculation du véhicule que vous souhaitez associer ?`,
    expectedResponse: StepExpectedResponseType.text,
    expectedResponseLength: 6,
    flowId: 2,
  },
  {
    level: 3,
    message: `Avez-vous déjà un véhicule associé ?
            \n1- Oui
            \n2- Non`,
    expectedResponse: StepExpectedResponseType.text,
    expectedResponseLength: 1,
    flowId: 2,
  },
  {
    level: 4,
    message: `Quelle est la plaque d'immatriculation de l'ancien véhicule ?`,
    expectedResponse: StepExpectedResponseType.text,
    expectedResponseLength: 6,
    flowId: 2,
  },
  {
    level: 5,
    message: `Voulez-vous vraiment vous dissocier de votre ancien véhicule pour vous associer à ce nouveau véhicule ?.
            \n1- Oui
            \n2- Non`,
    expectedResponse: StepExpectedResponseType.text,
    expectedResponseLength: 1,
    flowId: 2,
  },
  {
    level: 6,
    message: `Merci ! Nous traitons maintenant votre demande...`,
    expectedResponse: '',
    expectedResponseLength: 0,
    flowId: 2,
  },
  {
    level: 7,
    message: `Opération effectué avec succès.`,
    expectedResponse: '',
    expectedResponseLength: 0,
    flowId: 2,
  },
]
