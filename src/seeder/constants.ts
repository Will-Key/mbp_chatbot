import { CreateStepDto } from 'src/step/dto/create-step.dto'
import { CreateFlowDto } from '../flow/dto/create-flow.dto'
import { StepExpectedResponseType } from '@prisma/client'

export const INITIAL_FLOWS: CreateFlowDto[] = [
  {
    name: 'Inscription',
  },
  {
    name: 'Changement de véhicule',
  },
  {
    name: 'Modification de numéro de téléphone',
  },
]

export const INITIAL_STEPS: CreateStepDto[] = [
  {
    level: 0,
    message: `Merci d'avoir choisir le partenaire MBP pour vous connecter à votre compte Yango.
              \nVeuillez choisir un des services ci-après :
              \n1-	Je m'enregistre Chez le partenaire MBP
              \n2-	J'effectue le changement du véhicule associé à mon compte MBP
              \n3-	Je modifie le numéro associé à mon compte.
            `,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      {
        message: 'Veuillez choisir un nombre correspondant au service.',
        errorType: 'incorrectChoice',
      },
      {
        message:
          "La longueur de la valeur du service renseignée n'est pas égale à celle attendue",
        errorType: 'equalLength',
      },
    ],
  },
  {
    level: 1,
    message: `Pour vous enregistrer chez MBP, vous suivrez les étapes ci-après. 
              \nVous devriez entrez aux différentes étapes, les informations demandées.
              \nVeuillez entrer votre numéro de téléphone. 
            `,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      {
        message: 'Veuillez saisir les 10 chiffres de votre numéro de téléphone',
        errorType: 'equalLength',
      },
      {
        message: 'Ce numéro de téléphone est déjà associé à un chauffeur',
        errorType: 'isExist',
      },
    ],
    flowId: 1,
  },
  {
    level: 2,
    message: `Veuillez renseigner le code reçu par message. 
            `,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      {
        message: 'Code incorrect',
        errorType: 'equalLength',
      },
      {
        message: 'Code expiré',
        errorType: 'isExpire',
      },
    ],
    flowId: 1,
  },
  {
    level: 3,
    message: `Partager une photo lisible en recto uniquement de votre permis de conduire.
            `,
    expectedResponseType: StepExpectedResponseType.url,
    badResponseMessage: [
      {
        message: 'Veuillez envoyer la photo recto de votre permis',
        errorType: 'incorrectChoice',
      },
      {
        message: 'La taille de la photo envoyer trop grande',
        errorType: 'maxSize',
      },
    ],
    flowId: 1,
  },
  {
    level: 4,
    message: `Partager également une photo lisible en recto uniquement de la carte grise du véhicule auquel vous souhaitez être associé.`,
    expectedResponseType: StepExpectedResponseType.image,
    badResponseMessage: [
      {
        message:
          'Veuillez envoyer la photo recto de la carte grise du véhicule',
        errorType: 'incorrectChoice',
      },
      {
        message: 'La taille de la photo envoyer trop grande',
        errorType: 'maxSize',
      },
    ],
    flowId: 1,
  },
  {
    level: 14,
    message: `L'information renseignée n'est pas celle attendue.`,
    expectedResponseType: 'text',
    badResponseMessage: [],
    flowId: 1,
  },
  {
    level: 15,
    message: `L'opération a échoué, vous pouvez contacter un agent à partir de ce numéro +225 0710825902.n\n
      Pour vous rendre dans nos locaux suivez cette localisation.\n
      https://maps.app.goo.gl/LwUK42zQMGmrBzFb8.\n\n
      Pour reéssayer envoyer "Start"
    `,
    expectedResponseType: 'text',
    badResponseMessage: [],
    flowId: 1,
  },
  {
    level: 19,
    message: `Votre demande d'inscription à la plateforme MBP est terminée. Un message de confirmation suivi des instructions vous sera partagé dans moins de Cinq (05) mins.`,
    expectedResponseType: 'text',
    badResponseMessage: [],
    flowId: 1,
  },
  {
    level: 20,
    message: `Votre inscription à la plateforme a été effectué avec succès.`,
    expectedResponseType: 'text',
    badResponseMessage: [],
    flowId: 1,
  },
  {
    level: 24,
    message: `Votre inscription à la plateforme a échoué;\n
      Vous pouvez contacter un agent à partir de ce numéro +225 0710825902.\n
      Pour vous rendre dans nos locaux suivez cette localisation\n
      https://maps.app.goo.gl/LwUK42zQMGmrBzFb8.\n\n
      Pour reéssayer envoyer "Start"
    `,
    expectedResponseType: 'text',
    badResponseMessage: [],
    flowId: 1,
  },
  {
    level: 1,
    message: `D'accord, nous allons mettre à jour l'association de votre véhicule.
            \nVeuillez saisir le numéro de téléphone associé à votre compte.`,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      {
        message: 'Veuillez saisir les 10 chiffres de votre numéro de téléphone',
        errorType: 'equalLength',
      },
      {
        message: "Ce numéro de téléphone n'est pas associé à un chauffeur",
        errorType: 'isNotExist',
      },
    ],
    flowId: 2,
  },
  {
    level: 2,
    message: `Veuillez renseigner le code reçu par message.`,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      {
        message: 'Code incorrect',
        errorType: 'equalLength',
      },
      {
        message: 'Code expiré',
        errorType: 'isExpire',
      },
    ],
    flowId: 2,
  },
  {
    level: 3,
    message: `Partager une photo lisible en recto uniquement de la carte grise du véhicule auquel vous souhaitez être associé.`,
    expectedResponseType: StepExpectedResponseType.image,
    badResponseMessage: [
      {
        message:
          'Veuillez envoyer la photo recto de la carte grise du véhicule',
        errorType: 'incorrectChoice',
      },
      {
        message: 'La taille de la photo envoyer trop grande',
        errorType: 'maxSize',
      },
    ],
    flowId: 2,
  },
  {
    level: 6,
    message: `Merci ! Nous traitons maintenant votre demande...`,
    expectedResponseType: StepExpectedResponseType.text,
    flowId: 2,
  },
  {
    level: 7,
    message: `Opération effectué avec succès.`,
    flowId: 2,
  },
]
