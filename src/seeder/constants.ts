import { CreateStepDto } from 'src/step/dto/create-step.dto'
import { CreateFlowDto } from '../flow/dto/create-flow.dto'

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
    message: `Bienvenue chez votre partenaire MBP.
              \n Quel est votre requête ?
              \n 1 - Je veux m'inscrire
              \n 2 - Je veux m'associer à un nouveau véhicule`,
    expectedResponse: '1,2',
    expectedResponseLength: 1,
  },
  {
    level: 1,
    message: `Être vous en possession de votre permis et de la carte grise du véhicule ?
              \n 1 - Oui
              \n 2 - Non`,
    expectedResponse: '1,2',
    expectedResponseLength: 1,
    flowId: 1,
  },
  {
    level: 2,
    message: `Être vous en possession de votre permis et de la carte grise du véhicule ?
              \n 1 - Oui
              \n 2 - Non`,
    expectedResponse: '1,2',
    expectedResponseLength: 1,
    flowId: 1,
  },
  {
    level: 2,
    message: `Être vous en possession de votre permis et de la carte grise du véhicule ?
              \n 1 - Oui
              \n 2 - Non`,
    expectedResponse: '1,2',
    expectedResponseLength: 1,
    flowId: 1,
  },
  {
    level: 3,
    message: `Veuillez envoyer la photo recto de votre permis`,
    expectedResponse: 'data:image/png;base64,',
    expectedResponseLength: 100,
    flowId: 1,
  },
  {
    level: 4,
    message: `Veuillez envoyer la photo verso de votre permis`,
    expectedResponse: 'data:image/png;base64,',
    expectedResponseLength: 100,
    flowId: 1,
  },
  {
    level: 5,
    message: `Veuillez envoyer la photo recto de la carte grise`,
    expectedResponse: 'data:image/png;base64,',
    expectedResponseLength: 100,
    flowId: 1,
  },
  {
    level: 6,
    message: `Veuillez envoyer la photo verso de la carte grise`,
    expectedResponse: 'data:image/png;base64,',
    expectedResponseLength: 100,
    flowId: 1,
  },
  {
    level: 7,
    message: `Veuillez entrer votre nom`,
    expectedResponse: 'string',
    expectedResponseLength: 2,
    flowId: 1,
  },
  {
    level: 8,
    message: `Veuillez entrer votre prénom`,
    expectedResponse: 'string',
    expectedResponseLength: 2,
    flowId: 1,
  },
  {
    level: 9,
    message: `Veuillez entrer le numero de votre permis`,
    expectedResponse: 'number',
    expectedResponseLength: 15,
    flowId: 1,
  },
  {
    level: 10,
    message: `Veuillez entrer la date d'expiration`,
    expectedResponse: 'date',
    expectedResponseLength: 8,
    flowId: 1,
  },
  {
    level: 11,
    message: `Veuillez entrer la date de délivrance`,
    expectedResponse: 'date',
    expectedResponseLength: 8,
    flowId: 1,
  },
  {
    level: 99,
    message: `Vos informations ont été enregistré, nous enverrons un message pour vous informer du status de votre inscription.`,
    expectedResponse: '',
    expectedResponseLength: 0,
    flowId: 1,
  },
]
