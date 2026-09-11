// Types partagés, alignés sur les DTOs Spring Boot du backend ÉCHÉO.
// Toute modification d'un DTO Java côté backend doit être répercutée ici.

export type RepetitionType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type PaymentStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "SURPLUS"
  | "OVERDUE";

export type PaymentMethod = "CASH" | "MOBILE_MONEY" | "CARD";

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ReminderResponse {
  id: number;
  title: string;
  description?: string;
  dueDate: string; // format ISO "YYYY-MM-DD"
  dueTime?: string; // format "HH:mm:ss"
  repetitionType: RepetitionType;
  completed: boolean;
  nextOccurrence?: string;
}

export interface ReminderPayload {
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  repetitionType: RepetitionType;
}

export interface PublicPaymentDetails {
  eventTitle: string;
  memberFullName: string;
  requiredAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  tokenExpiresAt: string;
}

export interface PublicPaymentPayload {
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
}

// Le POST /public/pay/{token} renvoie directement l'entité EventMemberStatus
// JPA sérialisée par le backend (imbriquée), différente du DTO plat utilisé
// par le GET. Voir EventMemberStatusResult plus bas (même forme, réutilisée
// aussi par /payments/me).
export type PublicPaymentResult = EventMemberStatusResult;

export interface ApiErrorBody {
  timestamp?: string;
  status: number;
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

// --- Profil, mot de passe, historiques (ajouts audit) ---------------------

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export type NotificationType = "EMAIL" | "SMS" | "WHATSAPP";
export type NotificationStatus = "PENDING" | "SENT" | "DELIVERED" | "BOUNCED" | "FAILED";

export interface NotificationLog {
  id: number;
  recipientContact: string;
  type: NotificationType;
  messageContent: string;
  sentAt: string | null;
  status: NotificationStatus;
}

export interface PaymentHistoryEntry {
  id: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  paidAt: string;
}

// Forme réelle renvoyée par le backend pour EventMemberStatus (entité JPA
// imbriquée) — utilisée par /payments/me et /public/pay/{token} (POST).
export interface EventMemberStatusResult {
  id: number;
  requiredAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  event: {
    id: number;
    title: string;
    description?: string;
    targetAmount: number;
    eventDate: string;
  };
  member: {
    id: number;
    contactFullName: string;
    contactEmail: string;
    contactPhone?: string;
    registeredUser: boolean;
  };
}

// --- Groupes (page /groups, manquante malgré un backend complet) ---------

export interface GroupSummary {
  id: number;
  name: string;
  description?: string;
  owner: {
    id: number;
    fullName: string;
    email: string;
  };
  createdAt: string;
}

export interface GroupCreatePayload {
  name: string;
  description?: string;
}

export interface GroupMember {
  id: number;
  contactFullName: string;
  contactEmail: string;
  contactPhone?: string;
  registeredUser: boolean;
  joinedAt: string;
}

export interface AddGroupMemberPayload {
  userId?: number;
  fullName?: string;
  email?: string;
  phone?: string;
}

export interface GroupEvent {
  id: number;
  title: string;
  description?: string;
  targetAmount: number;
  eventDate: string;
  repetitionType: RepetitionType;
  nextOccurrence?: string;
  paused: boolean;
}

export interface GroupEventCreatePayload {
  title: string;
  description?: string;
  targetAmount: number;
  eventDate: string;
  groupMemberIds: number[];
  repetitionType: RepetitionType;
}

export interface GroupEventUpdatePayload {
  title: string;
  description?: string;
  targetAmount: number;
  eventDate: string;
  repetitionType: RepetitionType;
}

export interface PaymentToken {
  id: number;
  tokenUuid: string;
  expiresAt: string;
  used: boolean;
}
