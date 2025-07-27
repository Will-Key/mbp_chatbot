import { StepExpectedResponseType } from '@prisma/client'
import { CreateStepDto } from 'src/step/dto/create-step.dto'
import { CreateFlowDto } from '../flow/dto/create-flow.dto'

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
    message: `Merci d'avoir choisi le partenaire MBP pour vous connecter à votre compte Yango.
Veuillez sélectionner l'un des services suivant :
1-Ouverture de compte MBP
2-Changement de véhicule
3-Modification du numéro de téléphone
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
    message: `Merci de suivre les étapes ci-dessous pour finaliser votre inscription. 
Étape 1 : Veuillez entrer votre numéro de téléphone 
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
        message: 'Code incorrect.\nVeuillez saisir à nouveau le code reçu.',
        errorType: 'incorrectCode',
      },
      {
        message:
          'Code expiré.\nUn nouveau code vous a été envoyé.\nVeuillez saisir le nouveau code.',
        errorType: 'isExpired',
      },
    ],
    flowId: 1,
  },
  {
    level: 3,
    message: `Etape 3 : Veuillez partager une photo lisible, recto uniquement, de votre permis de conduire`,
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
    message: `Etape 4 : Veuillez partager une photo lisible, recto uniquement, de la carte grise du véhicule à associer à votre compte`,
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
    message: `L'opération a échoué, vous pouvez contacter un agent à partir de ce numéro +225 0710825902.\n
Pour vous rendre dans nos locaux suivez cette localisation:
https://maps.app.goo.gl/LwUK42zQMGmrBzFb8.\n
Pour reéssayer envoyer "Commencer"
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
    message: `Votre inscription chez MBP est validée ✅
Vous pouvez maintenant vous connecter au partenaire MBP via YANGO PRO pour finaliser les différents contrôles photo.\nEnvoyez "Commencer" pour démarrer un nouveau processus.`,
    expectedResponseType: 'text',
    badResponseMessage: [],
    flowId: 1,
  },
  {
    level: 24,
    message: `Votre inscription à la plateforme a échoué;
Vous pouvez contacter un agent à partir de ce numéro +225 0710825902.
Pour vous rendre dans nos locaux suivez cette localisation
https://maps.app.goo.gl/LwUK42zQMGmrBzFb8.
Pour reéssayer envoyer "Commencer"
    `,
    expectedResponseType: 'text',
    badResponseMessage: [],
    flowId: 1,
  },
  {
    level: 1,
    message: `Merci de suivre les étapes ci-dessous pour finaliser le changement de véhicule.\nÉtape 1 : Veuillez entrer votre numéro de téléphone.`,
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
    message: `Etape 2 : Veuillez saisir le code que vous avez reçu par SMS`,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      {
        message: 'Code incorrect.\nVeuillez saisir à nouveau le code.',
        errorType: 'incorrectCode',
      },
      {
        message:
          'Code expiré.\nUn nouveau code vous a été envoyé.\nVeuillez saisir le nouveau code.',
        errorType: 'isExpired',
      },
    ],
    flowId: 2,
  },
  {
    level: 3,
    message: `Etape 3 : Veuillez partager une photo lisible, recto uniquement, de la carte grise du véhicule à associer à votre compte`,
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
    message: `Merci ! Nous traitons maintenant votre demande...\nUn retour vous sera fait dans 5 minutes.`,
    expectedResponseType: StepExpectedResponseType.text,
    flowId: 2,
  },
  {
    level: 7,
    message: `Opération effectué avec succès.\nL'association au nouveau véhicule a été effectué avec succès.\nEnvoyez "Commencer" pour démarrer un nouveau processus.`,
    flowId: 2,
  },
  {
    level: 1,
    message: `Merci de suivre les étapes ci-dessous pour finaliser le changement de numéro.\nÉtape 1: Veuillez entrer votre numéro de téléphone actuel.`,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      {
        message: 'Veuillez saisir les 10 chiffres de votre numéro de téléphone',
        errorType: 'equalLength',
      },
      {
        message:
          "Votre numéro actuel n'est pas enregistré sur Yango. Veuillez vérifier le numéro saisi",
        errorType: 'isNotExist',
      },
    ],
    flowId: 3,
  },
  {
    level: 2,
    message: `Etape 2: Veuillez saisir le code que vous avez reçu par SMS`,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      {
        message: 'Code incorrect.\nVeuillez saisir à nouveau le code.',
        errorType: 'incorrectCode',
      },
      {
        message:
          'Code expiré.\nUn nouveau code vous a été envoyé.\nVeuillez saisir le nouveau code.',
        errorType: 'isExpired',
      },
    ],
    flowId: 3,
  },
  {
    level: 3,
    message: `Etape 3: Veuillez saisir le nouveau numéro`,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      {
        message: 'Veuillez saisir les 10 chiffres de votre nouveau numéro',
        errorType: 'equalLength',
      },
      {
        message:
          "Ce numéro de téléphone n'est pas valide.\nVeuillez entrer un nouveau numéro",
        errorType: 'isExist',
      },
    ],
    flowId: 3,
  },
  {
    level: 4,
    message: `Etape 4: Veuillez saisir le code que vous avez reçu par SMS`,
    expectedResponseType: StepExpectedResponseType.text,
    badResponseMessage: [
      {
        message: 'Code incorrect.\nVeuillez saisir à nouveau le code.',
        errorType: 'incorrectCode',
      },
      {
        message:
          'Code expiré.\nUn nouveau code vous a été envoyé.\nVeuillez saisir le nouveau code.',
        errorType: 'isExpired',
      },
    ],
    flowId: 3,
  },
  {
    level: 5,
    message: `Merci ! Nous traitons maintenant votre demande...\nUn retour vous sera fait dans 5 minutes.`,
    expectedResponseType: StepExpectedResponseType.text,
    flowId: 3,
  },
  {
    level: 6,
    message: `Votre numéro a été mis à jour avec succès.\nEnvoyez "Commencer" pour démarrer un nouveau processus.`,
    flowId: 3,
  },
]
