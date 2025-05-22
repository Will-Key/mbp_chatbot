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
    message: `Partager une photo lisible de votre permis en resto et verso.
            \nPartager d'abord la photo recto de votre permis.
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
    message: `Partager Ensuite le verso du permis`,
    expectedResponseType: StepExpectedResponseType.image,
    badResponseMessage: [
      {
        message: 'Veuillez envoyer la photo verso de votre permis',
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
    level: 5,
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
    level: 6,
    message: `Veuillez entrer votre nom`,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      { message: 'Veuillez entrer votre nom', errorType: 'minLength' },
    ],
    flowId: 1,
  },
  {
    level: 7,
    message: `Veuillez entrer votre prénom`,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      { message: 'Veuillez entrer votre nom', errorType: 'minLength' },
    ],
    flowId: 1,
  },
  {
    level: 8,
    message: `Veuillez entrer le numero de votre permis`,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      {
        message: 'Veuillez entrer le numéro de votre permis',
        errorType: 'minLength',
      },
    ],
    flowId: 1,
  },
  {
    level: 9,
    message: `Veuillez entrer la date d'expiration`,
    expectedResponseType: StepExpectedResponseType.date,
    badResponseMessage: [
      { message: "Veuillez entrer la date d'expiration", errorType: 'isDate' },
    ],
    flowId: 1,
  },
  {
    level: 10,
    message: `Veuillez entrer la date de délivrance`,
    expectedResponseType: StepExpectedResponseType.date,
    badResponseMessage: [
      { message: 'Veuillez entrer la date de délivrance', errorType: 'isDate' },
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
    message: `L'opération a échoué, vous pouvez vous rendre dans les locaux de MBP GROUP ou réessayer de vous inscrire en passant par chat.\n1- Je me rends chez mon partenaire.\n2- Je m'inscris par chat.`,
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
    message: `Votre inscription à la plateforme a échoué`,
    expectedResponseType: 'text',
    badResponseMessage: [],
    flowId: 1,
  },
  // {
  //   level: 1,
  //   message: `D'accord, nous allons mettre à jour l'association de votre véhicule.
  //           \nVeuillez saisir votre numéro de téléphone.`,
  //   expectedResponseType: StepExpectedResponseType.text,
  //   badResponseMessage: [
  //     {
  //       message: 'Veuillez saisir les 10 chiffres de votre numéro de téléphone',
  //       errorType: 'equalLength',
  //     },
  //     {
  //       message: "Ce numéro de téléphone n'est pas associé à un chauffeur",
  //       errorType: 'isNotExist',
  //     },
  //   ],
  //   flowId: 2,
  // },
  // {
  //   level: 2,
  //   message: `Merci ! Quelle est la plaque d'immatriculation du véhicule que vous souhaitez associer ?`,
  //   expectedResponseType: StepExpectedResponseType.text,
  //   badResponseMessage: [
  //     {
  //       message: 'Veuillez saisir les 10 chiffres de votre numéro de téléphone',
  //       errorType: 'equalLength',
  //     },
  //     {
  //       message: 'Ce numéro de téléphone est déjà associé à un chauffeur',
  //       errorType: 'isExist',
  //     },
  //   ],
  //   flowId: 2,
  // },
  // {
  //   level: 3,
  //   message: `Avez-vous déjà un véhicule associé ?
  //           \n1- Oui
  //           \n2- Non`,
  //   expectedResponseType: StepExpectedResponseType.text,
  //   expectedResponseLength: 1,
  //   flowId: 2,
  // },
  // {
  //   level: 4,
  //   message: `Quelle est la plaque d'immatriculation de l'ancien véhicule ?`,
  //   expectedResponseType: StepExpectedResponseType.text,
  //   expectedResponseLength: 6,
  //   flowId: 2,
  // },
  // {
  //   level: 5,
  //   message: `Voulez-vous vraiment vous dissocier de votre ancien véhicule pour vous associer à ce nouveau véhicule ?.
  //           \n1- Oui
  //           \n2- Non`,
  //   expectedResponseType: StepExpectedResponseType.text,
  //   expectedResponseLength: 1,
  //   flowId: 2,
  // },
  // {
  //   level: 6,
  //   message: `Merci ! Nous traitons maintenant votre demande...`,
  //   expectedResponseType: '',
  //   badResponseMessage: [
  //     { message: 'Veuillez entrer votre nom', errorType: 'minLength' },
  //   ],
  //   flowId: 2,
  // },
  // {
  //   level: 7,
  //   message: `Opération effectué avec succès.`,
  //   expectedResponseType: '',
  //   badResponseMessage: [
  //     { message: 'Veuillez entrer votre nom', errorType: 'minLength' },
  //   ],
  //   flowId: 2,
  // },
]
