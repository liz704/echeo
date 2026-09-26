"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarPlus, ChevronRight, Mail, Pause, Pencil, Play, UserPlus, Users } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import {
  addGroupMember,
  createGroupEvent,
  deleteGroup,
  deleteGroupEvent,
  fetchGroup,
  fetchGroupEvents,
  fetchGroupHistory,
  fetchGroupMembers,
  pauseGroupEvent,
  removeGroupMember,
  resumeGroupEvent,
  updateGroup,
  updateGroupEvent,
} from "@/lib/endpoints";
import type { GroupEvent, GroupMember, GroupPaymentHistoryItem, GroupSummary, RepetitionType } from "@/lib/types";
import { Trash2 } from "lucide-react";

const REPETITION_LABELS: Record<RepetitionType, string> = {
  NONE: "Aucune (ponctuel)",
  DAILY: "Quotidienne",
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuelle",
  YEARLY: "Annuelle",
};

function formatAmount(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

function GroupDetailContent() {
  const params = useParams<{ groupId: string }>();
  const groupId = Number(params.groupId);
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [group, setGroup] = useState<GroupSummary | null>(null);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [historyPayments, setHistoryPayments] = useState<GroupPaymentHistoryItem[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ajout de membre — externe par défaut (pas besoin de compte ÉCHÉO) :
  // seuls un nom et un email sont demandés.
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberFullName, setMemberFullName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Création d'événement
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventTargetAmount, setEventTargetAmount] = useState("");
  const [eventWithdrawalFee, setEventWithdrawalFee] = useState("");
  const [eventHasMoney, setEventHasMoney] = useState(true);
  const [eventDate, setEventDate] = useState("");
  // Heure des relances de cet événement (optionnelle — 08:00 par défaut côté
  // backend si laissée vide).
  const [eventTime, setEventTime] = useState("");
  const [eventRepetitionType, setEventRepetitionType] = useState<RepetitionType>("NONE");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // Modification d'un événement à venir
  const [editingEvent, setEditingEvent] = useState<GroupEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTargetAmount, setEditTargetAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editRepetitionType, setEditRepetitionType] = useState<RepetitionType>("NONE");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [editGroupError, setEditGroupError] = useState<string | null>(null);

  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const [memberToDelete, setMemberToDelete] = useState<GroupMember | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const [eventToDelete, setEventToDelete] = useState<GroupEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  async function handleSaveGroup() {
    if (!editGroupName.trim()) {
      setEditGroupError("Le nom du groupe est obligatoire.");
      return;
    }
    setEditGroupError(null);
    setIsSavingGroup(true);
    try {
      const updated = await updateGroup(groupId, {
        name: editGroupName.trim(),
        description: editGroupDescription.trim() || undefined,
      });
      setGroup(updated);
      showSuccess("Groupe modifié avec succès.");
      setIsEditGroupModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la modification du groupe.";
      setEditGroupError(message);
      showError(message);
    } finally {
      setIsSavingGroup(false);
    }
  }

  async function handleConfirmDeleteGroup() {
    setIsDeletingGroup(true);
    try {
      await deleteGroup(groupId);
      showSuccess("Groupe supprimé.");
      router.push("/groups");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la suppression du groupe.";
      showError(message);
    } finally {
      setIsDeletingGroup(false);
      setIsDeleteGroupModalOpen(false);
    }
  }

  async function handleConfirmDeleteMember() {
    if (!memberToDelete) return;
    setIsDeletingMember(true);
    try {
      await removeGroupMember(groupId, memberToDelete.id);
      setMembers((current) => current.filter((m) => m.id !== memberToDelete.id));
      showSuccess(`${memberToDelete.contactFullName} retiré du groupe.`);
      setMemberToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec du retrait du membre.";
      showError(message);
    } finally {
      setIsDeletingMember(false);
    }
  }

  async function handleConfirmDeleteEvent() {
    if (!eventToDelete) return;
    setIsDeletingEvent(true);
    try {
      await deleteGroupEvent(groupId, eventToDelete.id);
      setEvents((current) => current.filter((e) => e.id !== eventToDelete.id));
      showSuccess(`"${eventToDelete.title}" supprimé.`);
      setEventToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la suppression de l'événement.";
      showError(message);
    } finally {
      setIsDeletingEvent(false);
    }
  }

  const [pausingEventId, setPausingEventId] = useState<number | null>(null);

  function loadAll() {
    setIsLoading(true);
    Promise.all([
      fetchGroup(groupId),
      fetchGroupEvents(groupId),
      fetchGroupMembers(groupId),
      fetchGroupHistory(groupId),
    ])
      .then(([groupData, eventsData, membersData, historyData]) => {
        setGroup(groupData);
        setEvents(eventsData);
        setMembers(membersData);
        setHistoryPayments(historyData.payments ?? []);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Impossible de charger ce groupe.";
        showError(message);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!memberFullName.trim() || !memberEmail.trim()) {
      setMemberError("Le nom et l'email du membre sont obligatoires.");
      return;
    }
    setMemberError(null);
    setIsAddingMember(true);

    try {
      const created = await addGroupMember(groupId, {
        fullName: memberFullName.trim(),
        email: memberEmail.trim(),
        phone: memberPhone.trim() || undefined,
      });
      setMembers((current) => [...current, created]);
      showSuccess("Membre ajouté au groupe.");
      setMemberFullName("");
      setMemberEmail("");
      setMemberPhone("");
      setIsMemberModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de l'ajout du membre.";
      setMemberError(message);
      showError(message);
    } finally {
      setIsAddingMember(false);
    }
  }

  function toggleMemberSelection(memberId: number) {
    setSelectedMemberIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]
    );
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const targetAmount = eventHasMoney ? Number(eventTargetAmount) : undefined;

    if (!eventTitle.trim() || (eventHasMoney && !targetAmount) || !eventDate || selectedMemberIds.length === 0) {
      setEventError(
        eventHasMoney
          ? "Titre, montant cible, date et au moins un membre sélectionné sont obligatoires."
          : "Titre, date et au moins un membre sélectionné sont obligatoires."
      );
      return;
    }
    setEventError(null);
    setIsCreatingEvent(true);

    try {
      const created = await createGroupEvent(groupId, {
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        targetAmount,
        withdrawalFeeAmount: eventHasMoney && eventWithdrawalFee ? Number(eventWithdrawalFee) : undefined,
        eventDate,
        eventTime: eventTime || undefined,
        groupMemberIds: selectedMemberIds,
        repetitionType: eventRepetitionType,
      });
      setEvents((current) => [...current, created]);
      showSuccess("Événement créé avec succès.");
      setEventTitle("");
      setEventDescription("");
      setEventTargetAmount("");
      setEventWithdrawalFee("");
      setEventHasMoney(true);
      setEventDate("");
      setEventTime("");
      setEventRepetitionType("NONE");
      setSelectedMemberIds([]);
      setIsEventModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la création de l'événement.";
      setEventError(message);
      showError(message);
    } finally {
      setIsCreatingEvent(false);
    }
  }

  function openEditModal(groupEvent: GroupEvent) {
    setEditingEvent(groupEvent);
    setEditTitle(groupEvent.title);
    setEditDescription(groupEvent.description ?? "");
    // null/undefined = événement sans argent : on laisse le champ vide.
    setEditTargetAmount(
      groupEvent.targetAmount != null ? String(groupEvent.targetAmount) : ""
    );
    setEditDate(groupEvent.eventDate);
    // Le backend renvoie "HH:mm:ss" (LocalTime) ; l'input time attend "HH:mm".
    setEditTime(groupEvent.eventTime ? groupEvent.eventTime.slice(0, 5) : "");
    setEditRepetitionType(groupEvent.repetitionType);
    setEditError(null);
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingEvent) return;

    const isWithMoney = editingEvent.targetAmount != null;
    const targetAmount = isWithMoney ? Number(editTargetAmount) : undefined;

    if (!editTitle.trim() || !editDate) {
      setEditError("Titre et date sont obligatoires.");
      return;
    }
    if (isWithMoney && (!targetAmount || targetAmount < 0 || Number.isNaN(targetAmount))) {
      setEditError("Le montant cible est obligatoire pour un événement avec argent.");
      return;
    }
    setEditError(null);
    setIsSavingEdit(true);

    try {
      const updated = await updateGroupEvent(groupId, editingEvent.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        // On n'envoie targetAmount que si l'événement est (et reste) avec argent.
        // Envoyer undefined pour un événement sans argent le laisse null côté backend.
        targetAmount: isWithMoney ? targetAmount : undefined,
        eventDate: editDate,
        eventTime: editTime || undefined,
        repetitionType: editRepetitionType,
      });
      setEvents((current) => current.map((e) => (e.id === updated.id ? updated : e)));
      showSuccess("Événement modifié avec succès.");
      setEditingEvent(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la modification.";
      setEditError(message);
      showError(message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleTogglePause(groupEvent: GroupEvent) {
    setPausingEventId(groupEvent.id);
    try {
      const updated = groupEvent.paused
        ? await resumeGroupEvent(groupId, groupEvent.id)
        : await pauseGroupEvent(groupId, groupEvent.id);
      setEvents((current) => current.map((e) => (e.id === updated.id ? updated : e)));
      showSuccess(updated.paused ? "Récurrence mise en pause." : "Récurrence reprise.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de l'opération.";
      showError(message);
    } finally {
      setPausingEventId(null);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events.filter((e) => e.eventDate >= todayStr);
  const pastEvents = events
    .filter((e) => e.eventDate < todayStr)
    .slice()
    .sort((a, b) => (a.eventDate < b.eventDate ? 1 : -1));

  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CASH: "Espèces",
    MOBILE_MONEY: "Mobile Money",
    ORANGE_MONEY: "Orange Money",
    CARD: "Carte bancaire",
  };

  if (isLoading || !group) {
    return <FullPageSpinner label="Chargement du groupe..." />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/groups"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux groupes
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{group.name}</h1>
          {group.description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{group.description}</p>
          )}
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Propriétaire : {group.owner.fullName}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              setEditGroupName(group.name);
              setEditGroupDescription(group.description ?? "");
              setIsEditGroupModalOpen(true);
            }}
            aria-label="Modifier le groupe"
            title="Modifier le groupe"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteGroupModalOpen(true)}
            aria-label="Supprimer le groupe"
            title="Supprimer le groupe"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIsMemberModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter un membre
        </button>
        <button
          type="button"
          onClick={() => setIsEventModalOpen(true)}
          disabled={members.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          <CalendarPlus className="h-4 w-4" />
          Nouvel événement
        </button>
      </div>

      {/* Membres */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Users className="h-4 w-4" />
          Membres ({members.length})
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucun membre pour l'instant. Un membre n'a pas besoin de compte ÉCHÉO — juste un nom et un email.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{member.contactFullName}</p>
                  <p className="text-xs text-slate-400">{member.contactEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  {member.registeredUser && (
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      Inscrit
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setMemberToDelete(member)}
                    aria-label="Retirer ce membre"
                    title="Retirer ce membre"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Événements à venir */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Événements à venir</h2>

        {upcomingEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Aucun événement à venir pour l'instant.
          </div>
        ) : (
          <ul className="space-y-3">
            {upcomingEvents.map((groupEvent) => {
              const isUpcoming = true;
              const isRecurring = groupEvent.repetitionType !== "NONE";

              return (
                <li
                  key={groupEvent.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900"
                >
                  <Link
                    href={`/groups/${groupId}/events/${groupEvent.id}`}
                    className="flex flex-1 items-center justify-between transition hover:opacity-80"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white">{groupEvent.title}</p>
                        {isRecurring && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              groupEvent.paused
                                ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {REPETITION_LABELS[groupEvent.repetitionType]}
                            {groupEvent.paused ? " (en pause)" : ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Échéance : {groupEvent.eventDate}
                        {groupEvent.eventTime ? ` à ${groupEvent.eventTime.slice(0, 5)}` : ""}
                        {groupEvent.targetAmount != null
                          ? ` — Objectif : ${formatAmount(groupEvent.targetAmount)}`
                          : " — Info (sans argent)"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </Link>

                  <div className="flex shrink-0 gap-2">
                    {isUpcoming && (
                      <button
                        type="button"
                        onClick={() => openEditModal(groupEvent)}
                        aria-label="Modifier"
                        title="Modifier (événement à venir uniquement)"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {isRecurring && (
                      <button
                        type="button"
                        onClick={() => handleTogglePause(groupEvent)}
                        disabled={pausingEventId === groupEvent.id}
                        aria-label={groupEvent.paused ? "Reprendre" : "Mettre en pause"}
                        title={groupEvent.paused ? "Reprendre la récurrence" : "Mettre la récurrence en pause"}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        {pausingEventId === groupEvent.id ? (
                          <Spinner size={14} />
                        ) : groupEvent.paused ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEventToDelete(groupEvent)}
                      aria-label="Supprimer l'événement"
                      title="Supprimer l'événement"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>


      {/* Historique du groupe */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Historique du groupe</h2>

        <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Événements passés</h3>
        {pastEvents.length === 0 ? (
          <div className="mb-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Aucun événement passé.
          </div>
        ) : (
          <ul className="mb-6 space-y-2">
            {pastEvents.map((groupEvent) => (
              <li key={groupEvent.id}>
                <Link
                  href={`/groups/${groupId}/events/${groupEvent.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:opacity-80 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{groupEvent.title}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Échéance : {groupEvent.eventDate}
                      {groupEvent.targetAmount != null
                        ? ` — Objectif : ${formatAmount(groupEvent.targetAmount)}`
                        : " — Info (sans argent)"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Paiements enregistrés</h3>
        {historyPayments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Aucun paiement enregistré pour ce groupe.
          </div>
        ) : (
          <ul className="space-y-2">
            {historyPayments.map((payment) => (
              <li
                key={payment.id}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {payment.memberFullName ?? "Membre"} — {formatAmount(payment.amountPaid)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {payment.eventTitle ?? "Événement"}
                      {" · "}
                      {PAYMENT_METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}
                      {" · "}
                      {new Date(payment.paidAt).toLocaleString("fr-FR")}
                      {payment.transactionRef ? ` · Réf. ${payment.transactionRef}` : ""}
                    </p>
                  </div>
                  {payment.eventId != null && (
                    <Link
                      href={`/groups/${groupId}/events/${payment.eventId}`}
                      className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
                    >
                      Voir l&apos;événement
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modale ajout membre (externe : nom + email suffisent) */}
      <Modal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)} title="Ajouter un membre">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Nom complet
            </label>
            <input
              type="text"
              placeholder="Ex : Awa Ngono"
              value={memberFullName}
              onChange={(e) => setMemberFullName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="awa@exemple.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Téléphone <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <input
              type="tel"
              placeholder="+237 6XX XXX XXX"
              value={memberPhone}
              onChange={(e) => setMemberPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <p className="text-xs text-slate-400">
            Ce membre n'a pas besoin de compte ÉCHÉO — il recevra ses relances et reçus par email.
          </p>

          {memberError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {memberError}
            </p>
          )}

          <button
            type="submit"
            disabled={isAddingMember}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isAddingMember && <Spinner size={16} />}
            Ajouter
          </button>
        </form>
      </Modal>

      {/* Modale création événement — sélection réelle des membres */}
      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="Nouvel événement">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Titre</label>
            <input
              type="text"
              placeholder="Ex : Cotisation mariage"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Description <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Type de rappel
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEventHasMoney(true)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  eventHasMoney
                    ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                    : "border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                Avec argent (cotisation)
              </button>
              <button
                type="button"
                onClick={() => setEventHasMoney(false)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  !eventHasMoney
                    ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                    : "border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                Sans argent (info)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {eventHasMoney && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Montant cible (FCFA)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="Ex : 50000"
                  value={eventTargetAmount}
                  onChange={(e) => setEventTargetAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}
            {eventHasMoney && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Frais de retrait <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="Ex : 300"
                  value={eventWithdrawalFee}
                  onChange={(e) => setEventWithdrawalFee(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Un membre qui envoie ce montant en plus n'est pas compté en surplus.
                </p>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Date de l'événement
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Heure des relances (optionnel, 08:00 par défaut)
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Récurrence
            </label>
            <select
              value={eventRepetitionType}
              onChange={(e) => setEventRepetitionType(e.target.value as RepetitionType)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {Object.entries(REPETITION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Si récurrent, la prochaine occurrence sera générée automatiquement à l'échéance, avec report du solde impayé ou du surplus.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Membres concernés — un seul, plusieurs, ou tout le groupe
            </label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              {members.map((member) => (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(member.id)}
                    onChange={() => toggleMemberSelection(member.id)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-slate-700 dark:text-slate-200">{member.contactFullName}</span>
                  <span className="text-xs text-slate-400">{member.contactEmail}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Le montant cible sera réparti à parts égales entre les membres cochés.
            </p>
          </div>

          {eventError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {eventError}
            </p>
          )}

          <button
            type="submit"
            disabled={isCreatingEvent}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isCreatingEvent && <Spinner size={16} />}
            Créer l'événement
          </button>
        </form>
      </Modal>

      {/* Modale modification (événement à venir uniquement) */}
      <Modal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        title={`Modifier — ${editingEvent?.title ?? ""}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Titre</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className={`grid gap-3 ${editingEvent?.targetAmount != null ? "grid-cols-3" : "grid-cols-2"}`}>
            {editingEvent?.targetAmount != null && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Montant cible (FCFA)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editTargetAmount}
                  onChange={(e) => setEditTargetAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Date
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Heure (optionnel)
              </label>
              <input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Récurrence
            </label>
            <select
              value={editRepetitionType}
              onChange={(e) => setEditRepetitionType(e.target.value as RepetitionType)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {Object.entries(REPETITION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {editError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {editError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSavingEdit}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isSavingEdit && <Spinner size={16} />}
            Enregistrer
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isEditGroupModalOpen}
        onClose={() => {
          setIsEditGroupModalOpen(false);
          setEditGroupError(null);
        }}
        title="Modifier le groupe"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Nom du groupe
            </label>
            <input
              type="text"
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Description <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <textarea
              value={editGroupDescription}
              onChange={(e) => setEditGroupDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          {editGroupError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {editGroupError}
            </p>
          )}
          <button
            type="button"
            onClick={handleSaveGroup}
            disabled={isSavingGroup}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isSavingGroup && <Spinner size={16} />}
            Enregistrer
          </button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteGroupModalOpen}
        title="Supprimer ce groupe ?"
        description={`Cette action est irréversible : "${group?.name ?? ""}" et tous ses membres, événements et paiements associés seront définitivement supprimés.`}
        confirmLabel="Supprimer"
        isDangerous
        isLoading={isDeletingGroup}
        onConfirm={handleConfirmDeleteGroup}
        onCancel={() => setIsDeleteGroupModalOpen(false)}
      />

      <ConfirmModal
        isOpen={!!memberToDelete}
        title="Retirer ce membre ?"
        description={`"${memberToDelete?.contactFullName ?? ""}" sera retiré du groupe, avec son historique de paiement pour ce groupe.`}
        confirmLabel="Retirer"
        isDangerous
        isLoading={isDeletingMember}
        onConfirm={handleConfirmDeleteMember}
        onCancel={() => setMemberToDelete(null)}
      />

      <ConfirmModal
        isOpen={!!eventToDelete}
        title="Supprimer cet événement ?"
        description={`"${eventToDelete?.title ?? ""}" et le suivi de tous les membres pour cet événement seront définitivement supprimés.`}
        confirmLabel="Supprimer"
        isDangerous
        isLoading={isDeletingEvent}
        onConfirm={handleConfirmDeleteEvent}
        onCancel={() => setEventToDelete(null)}
      />
    </main>
  );
}

export default function GroupDetailPage() {
  return (
    <AuthGuard>
      <AppNavbar />
      <GroupDetailContent />
    </AuthGuard>
  );
}
