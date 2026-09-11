import { apiClient } from "./api";
import type {
  AuthResponse,
  AddGroupMemberPayload,
  ChangePasswordPayload,
  EventMemberStatusResult,
  ForgotPasswordPayload,
  GroupCreatePayload,
  GroupEvent,
  GroupEventCreatePayload,
  GroupEventUpdatePayload,
  GroupMember,
  GroupSummary,
  LoginPayload,
  NotificationLog,
  PaymentHistoryEntry,
  PaymentMethod,
  PaymentToken,
  PublicPaymentDetails,
  PublicPaymentPayload,
  PublicPaymentResult,
  RegisterPayload,
  ReminderPayload,
  ReminderResponse,
  ResetPasswordPayload,
  UpdateProfilePayload,
  UserProfile,
} from "./types";

// --- Authentification -------------------------------------------------

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/register", payload);
  return response.data;
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  await apiClient.post("/auth/forgot-password", payload);
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiClient.post("/auth/reset-password", payload);
}

// --- Profil utilisateur (page Paramètres) --------------------------------

export async function fetchMyProfile(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>("/users/me");
  return response.data;
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const response = await apiClient.put<UserProfile>("/users/me", payload);
  return response.data;
}

export async function changeMyPassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.put("/users/me/password", payload);
}

// --- Rappels personnels -------------------------------------------------

export async function fetchActiveReminders(): Promise<ReminderResponse[]> {
  const response = await apiClient.get<ReminderResponse[]>("/reminders");
  return response.data;
}

export async function fetchReminderHistory(): Promise<ReminderResponse[]> {
  const response = await apiClient.get<ReminderResponse[]>("/reminders/history");
  return response.data;
}

export async function createReminder(payload: ReminderPayload): Promise<ReminderResponse> {
  const response = await apiClient.post<ReminderResponse>("/reminders", payload);
  return response.data;
}

export async function markReminderCompleted(id: number): Promise<ReminderResponse> {
  const response = await apiClient.patch<ReminderResponse>(`/reminders/${id}/complete`);
  return response.data;
}

export async function deleteReminder(id: number): Promise<void> {
  await apiClient.delete(`/reminders/${id}`);
}

// --- Paiement public (sans JWT) -----------------------------------------

export async function fetchPublicPaymentDetails(token: string): Promise<PublicPaymentDetails> {
  const response = await apiClient.get<PublicPaymentDetails>(`/public/pay/${token}`);
  return response.data;
}

export async function submitPublicPayment(
  token: string,
  payload: PublicPaymentPayload
): Promise<PublicPaymentResult> {
  const response = await apiClient.post<PublicPaymentResult>(`/public/pay/${token}`, payload);
  return response.data;
}

// --- Historiques (paiements, notifications) --------------------------------

export async function fetchMyPaymentStatuses(): Promise<EventMemberStatusResult[]> {
  const response = await apiClient.get<EventMemberStatusResult[]>("/payments/me");
  return response.data;
}

export async function fetchPaymentHistoryFor(
  eventMemberStatusId: number
): Promise<PaymentHistoryEntry[]> {
  const response = await apiClient.get<PaymentHistoryEntry[]>(
    `/payments/${eventMemberStatusId}/history`
  );
  return response.data;
}

export async function fetchNotificationHistory(): Promise<NotificationLog[]> {
  const response = await apiClient.get<NotificationLog[]>("/notifications/history");
  return response.data;
}

export async function deleteNotification(id: number): Promise<void> {
  await apiClient.delete(`/notifications/${id}`);
}

export async function deletePaymentHistoryEntry(paymentHistoryId: number): Promise<void> {
  await apiClient.delete(`/payments/history/${paymentHistoryId}`);
}

// --- Groupes ---------------------------------------------------------------

export async function fetchMyGroups(): Promise<GroupSummary[]> {
  const response = await apiClient.get<GroupSummary[]>("/groups/me");
  return response.data;
}

export async function createGroup(payload: GroupCreatePayload): Promise<GroupSummary> {
  const response = await apiClient.post<GroupSummary>("/groups", payload);
  return response.data;
}

export async function fetchGroup(groupId: number): Promise<GroupSummary> {
  const response = await apiClient.get<GroupSummary>(`/groups/${groupId}`);
  return response.data;
}

export async function addGroupMember(groupId: number, payload: AddGroupMemberPayload): Promise<GroupMember> {
  const response = await apiClient.post<GroupMember>(`/groups/${groupId}/members`, payload);
  return response.data;
}

export async function fetchGroupMembers(groupId: number): Promise<GroupMember[]> {
  const response = await apiClient.get<GroupMember[]>(`/groups/${groupId}/members`);
  return response.data;
}

export async function fetchGroupEvents(groupId: number): Promise<GroupEvent[]> {
  const response = await apiClient.get<GroupEvent[]>(`/groups/${groupId}/events`);
  return response.data;
}

export async function createGroupEvent(
  groupId: number,
  payload: GroupEventCreatePayload
): Promise<GroupEvent> {
  const response = await apiClient.post<GroupEvent>(`/groups/${groupId}/events`, payload);
  return response.data;
}

export async function updateGroupEvent(
  groupId: number,
  eventId: number,
  payload: GroupEventUpdatePayload
): Promise<GroupEvent> {
  const response = await apiClient.put<GroupEvent>(`/groups/${groupId}/events/${eventId}`, payload);
  return response.data;
}

export async function pauseGroupEvent(groupId: number, eventId: number): Promise<GroupEvent> {
  const response = await apiClient.patch<GroupEvent>(`/groups/${groupId}/events/${eventId}/pause`);
  return response.data;
}

export async function resumeGroupEvent(groupId: number, eventId: number): Promise<GroupEvent> {
  const response = await apiClient.patch<GroupEvent>(`/groups/${groupId}/events/${eventId}/resume`);
  return response.data;
}

export async function fetchEventMemberStatuses(eventId: number): Promise<EventMemberStatusResult[]> {
  const response = await apiClient.get<EventMemberStatusResult[]>(`/groups/events/${eventId}/statuses`);
  return response.data;
}

export async function recordPayment(
  eventMemberStatusId: number,
  amount: number,
  paymentMethod: PaymentMethod,
  transactionRef?: string
): Promise<EventMemberStatusResult> {
  const response = await apiClient.post<EventMemberStatusResult>("/payments", {
    eventMemberStatusId,
    amount,
    paymentMethod,
    transactionRef,
  });
  return response.data;
}

export async function generatePaymentLink(eventMemberStatusId: number): Promise<PaymentToken> {
  const response = await apiClient.post<PaymentToken>(`/payments/${eventMemberStatusId}/token`);
  return response.data;
}
