export const APP_PARAMETER_KEYS = {
  referralBonusAmount: 'REFERRAL_BONUS_AMOUNT',
  referralTrigger: 'REFERRAL_TRIGGER',
  referralFilleulRidesThreshold: 'REFERRAL_FILLEUL_RIDES_THRESHOLD',
  referralMonthlyCapPerSponsor: 'REFERRAL_MONTHLY_CAP_PER_SPONSOR',
  loyaltyBonusAutoCredit: 'LOYALTY_BONUS_AUTO_CREDIT',
  loyaltyPeriodCutoffDays: 'LOYALTY_PERIOD_CUTOFF_DAYS',
  notificationChannel: 'NOTIFICATION_CHANNEL',
  loyaltyBonusMinDriverAgeDays: 'LOYALTY_BONUS_MIN_DRIVER_AGE_DAYS',
} as const

export const REFERRAL_TRIGGERS = {
  onRegistration: 'ON_REGISTRATION',
  onFilleulRides: 'ON_FILLEUL_RIDES',
} as const

export type ReferralTrigger =
  (typeof REFERRAL_TRIGGERS)[keyof typeof REFERRAL_TRIGGERS]

export const NOTIFICATION_CHANNELS = {
  whatsapp: 'WHATSAPP',
  sms: 'SMS',
  both: 'BOTH',
} as const

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS]

export const INITIAL_APP_PARAMETERS: {
  key: string
  value: string
  description: string
}[] = [
  {
    key: APP_PARAMETER_KEYS.referralBonusAmount,
    value: '1000',
    description:
      "Montant en FCFA crédité au parrain. Sert de montant par défaut à la création d'une campagne de parrainage ; le montant de la campagne active prime.",
  },
  {
    key: APP_PARAMETER_KEYS.referralTrigger,
    value: REFERRAL_TRIGGERS.onRegistration,
    description: `Moment du crédit du parrain : ${REFERRAL_TRIGGERS.onRegistration} (dès la création du profil Yango du filleul) ou ${REFERRAL_TRIGGERS.onFilleulRides} (quand le filleul atteint ${APP_PARAMETER_KEYS.referralFilleulRidesThreshold} courses terminées).`,
  },
  {
    key: APP_PARAMETER_KEYS.referralFilleulRidesThreshold,
    value: '75',
    description: `Nombre de courses terminées que le filleul doit atteindre pour déclencher le crédit du parrain. Utilisé uniquement si ${APP_PARAMETER_KEYS.referralTrigger} vaut ${REFERRAL_TRIGGERS.onFilleulRides}.`,
  },
  {
    key: APP_PARAMETER_KEYS.referralMonthlyCapPerSponsor,
    value: '',
    description:
      'Nombre maximum de parrainages rémunérés par parrain et par mois calendaire (anti-fraude). Vide = aucun plafond.',
  },
  {
    key: APP_PARAMETER_KEYS.loyaltyBonusAutoCredit,
    value: 'false',
    description:
      "true pour créditer réellement les bonus de fidélité sur Yango. false : le bonus est calculé, enregistré et notifié, mais aucun mouvement d'argent n'est fait.",
  },
  {
    key: APP_PARAMETER_KEYS.loyaltyPeriodCutoffDays,
    value: '1,16',
    description:
      'Jours du mois où une quinzaine se clôture et où les bonus de fidélité sont calculés, séparés par des virgules.',
  },
  {
    key: APP_PARAMETER_KEYS.notificationChannel,
    value: NOTIFICATION_CHANNELS.both,
    description: `Canal des notifications de bonus et de parrainage : ${NOTIFICATION_CHANNELS.whatsapp}, ${NOTIFICATION_CHANNELS.sms} (letexto) ou ${NOTIFICATION_CHANNELS.both}.`,
  },
  {
    key: APP_PARAMETER_KEYS.loyaltyBonusMinDriverAgeDays,
    value: '0',
    description:
      "Ancienneté minimale en jours pour qu'un chauffeur soit éligible au bonus de fidélité. 0 = aucune restriction. Mettre par exemple 30 pour exclure les chauffeurs trop récents.",
  },
]

export const INITIAL_LOYALTY_BONUS_TIERS: {
  minRides: number
  bonusAmount: number
}[] = [
  { minRides: 150, bonusAmount: 3000 },
  { minRides: 200, bonusAmount: 5000 },
  { minRides: 250, bonusAmount: 5000 },
  { minRides: 300, bonusAmount: 5000 },
]
