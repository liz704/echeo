// Les messages d'erreur renvoyés par l'API Spring Boot sont rédigés en français.
// Ce module les traduit côté client quand l'interface est en anglais, sans toucher
// au backend. Les messages inconnus sont renvoyés tels quels (jamais de perte d'info).

import type { Locale } from "./dictionaries";

const STORAGE_KEY = "echeo_locale";

export function currentLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "fr" || stored === "en") return stored;
  } catch {
    /* localStorage indisponible : on retombe sur la langue du navigateur */
  }
  return (navigator.language ?? "fr").toLowerCase().startsWith("en") ? "en" : "fr";
}

const EXACT_EN: Record<string, string> = {
  // Paiement en ligne
  "Rien à payer : cette échéance est déjà réglée.": "Nothing to pay: this due is already settled.",
  "Paiement en ligne non configuré (FAROTY_WALLET_ID manquant).": "Online payment is not configured yet.",
  // Authentification
  "Email ou mot de passe incorrect.": "Incorrect email or password.",
  "Authentification requise ou invalide.": "Authentication required or invalid.",
  "Un compte existe déjà avec cet email.": "An account with this email already exists.",
  "Lien de confirmation invalide.": "Invalid confirmation link.",
  "Lien de confirmation invalide ou déjà utilisé.": "Invalid or already used confirmation link.",
  "Format de token invalide.": "Invalid token format.",
  "Token de réinitialisation introuvable.": "Reset token not found.",
  "Ce lien de réinitialisation a déjà été utilisé.": "This reset link has already been used.",
  "Ce lien de réinitialisation a expiré.": "This reset link has expired.",
  "Le mot de passe actuel est incorrect.": "The current password is incorrect.",
  "Authentification requise ou expirée. Merci de vous reconnecter.": "Authentication required or expired. Please log in again.",
  "Vous n'avez pas accès à cette ressource.": "You do not have access to this resource.",
  // Validation générique
  "Un ou plusieurs champs sont invalides.": "One or more fields are invalid.",
  "Format d'email invalide.": "Invalid email format.",
  "L'email est obligatoire.": "Email is required.",
  "Le nom complet est obligatoire.": "Full name is required.",
  "Le mot de passe est obligatoire.": "Password is required.",
  "Le mot de passe actuel est obligatoire.": "Current password is required.",
  "Le nouveau mot de passe est obligatoire.": "New password is required.",
  "Le mot de passe doit contenir au moins 8 caractères.": "Password must be at least 8 characters long.",
  "Le nouveau mot de passe doit contenir au moins 8 caractères.": "New password must be at least 8 characters long.",
  "Le token de réinitialisation est obligatoire.": "Reset token is required.",
  "Le token de paiement est obligatoire.": "Payment token is required.",
  "Le titre est obligatoire.": "Title is required.",
  "Le titre de l'événement est obligatoire.": "Event title is required.",
  "La date d'échéance est obligatoire.": "Due date is required.",
  "La date de l'événement est obligatoire.": "Event date is required.",
  "Le nom du groupe est obligatoire.": "Group name is required.",
  "Le montant est obligatoire.": "Amount is required.",
  "Le montant cible ne peut pas être négatif.": "Target amount cannot be negative.",
  "Le type de récurrence est obligatoire.": "Repetition type is required.",
  "Le statut simulé est obligatoire.": "Simulated status is required.",
  // Paiements
  "L'identifiant du statut de paiement est obligatoire.": "Payment status ID is required.",
  "Le montant versé est obligatoire.": "Amount paid is required.",
  "Le montant versé doit être strictement positif.": "Amount paid must be greater than zero.",
  "Le moyen de paiement est obligatoire.": "Payment method is required.",
  "Le montant requis (required_amount) n'est pas défini pour ce statut.": "The required amount is not defined for this status.",
  "Incohérence : surplus calculé non positif.": "Inconsistency: computed surplus is not positive.",
  "La durée de validité du jeton doit être strictement positive.": "The token validity period must be greater than zero.",
  "Le jeton de paiement est obligatoire.": "Payment token is required.",
  "Ce lien de paiement a déjà été utilisé.": "This payment link has already been used.",
  "Ce lien de paiement a expiré.": "This payment link has expired.",
  "Format de lien de paiement invalide.": "Invalid payment link format.",
  // Planning hebdomadaire
  "Lien de planification invalide ou expiré.": "Invalid or expired planning link.",
  "Ajoute au moins une tâche.": "Add at least one task.",
  "Chaque tâche doit avoir une date.": "Each task must have a date.",
  "Ajoute au moins une tâche avec un titre.": "Add at least one task with a title.",
  "Le jour doit être entre 1 (lundi) et 7 (dimanche).": "The day must be between 1 (Monday) and 7 (Sunday).",
  // Rappels
  "L'identifiant du rappel est obligatoire.": "Reminder ID is required.",
  "Lien invalide ou expiré.": "Invalid or expired link.",
  "Lien invalide.": "Invalid link.",
  "Impossible de calculer la prochaine occurrence : due_date est nulle.": "Cannot compute the next occurrence: due date is empty.",
  "Le rappel ne peut pas être nul.": "The reminder cannot be empty.",
  "Le rappel doit être rattaché à un utilisateur valide.": "The reminder must belong to a valid user.",
  "Le titre du rappel est obligatoire.": "Reminder title is required.",
  "La date d'échéance (due_date) est obligatoire.": "Due date is required.",
  // Groupes
  "Seul le propriétaire du groupe peut effectuer cette action.": "Only the group owner can perform this action.",
  "Cet utilisateur est déjà membre du groupe.": "This user is already a member of the group.",
  "Un membre avec cet email fait déjà partie du groupe.": "A member with this email is already in the group.",
  "Au moins un membre doit être associé à l'événement.": "At least one member must be linked to the event.",
  "Cet événement n'est pas récurrent, rien à mettre en pause.": "This event is not recurring, nothing to pause.",
  "Cet événement n'est pas récurrent, rien à reprendre.": "This event is not recurring, nothing to resume.",
  // Erreurs front génériques
  "Une erreur inattendue est survenue. Veuillez réessayer.": "An unexpected error occurred. Please try again.",
};

const ENTITY_EN: Record<string, string> = {
  User: "User",
  Group: "Group",
  GroupMember: "Group member",
  GroupEvent: "Event",
  EventMemberStatus: "Payment status",
  PersonalReminder: "Reminder",
  PaymentHistory: "Payment entry",
  NotificationLog: "Notification",
};

const PATTERNS_EN: { re: RegExp; to: (m: RegExpMatchArray) => string }[] = [
  {
    re: /^User introuvable pour l'email : (.+)$/,
    to: (m) => `User not found for email: ${m[1]}`,
  },
  {
    re: /^Aucun utilisateur pour l'email : (.+)$/,
    to: (m) => `No user found for email: ${m[1]}`,
  },
  {
    re: /^PaymentToken introuvable pour l'UUID : (.+)$/,
    to: () => "This payment link is invalid or has expired.",
  },
  {
    re: /^(\w+) introuvable pour l'identifiant : (\d+)$/,
    to: (m) => `${ENTITY_EN[m[1]] ?? m[1]} not found (id ${m[2]}).`,
  },
];

export function translateApiMessage(message: string, locale: Locale): string {
  if (locale !== "en" || !message) return message;
  const exact = EXACT_EN[message.trim()];
  if (exact) return exact;
  for (const { re, to } of PATTERNS_EN) {
    const m = message.trim().match(re);
    if (m) return to(m);
  }
  return message;
}
