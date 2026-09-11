"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarPlus, ChevronRight, Mail, Pause, Pencil, Play, UserPlus, Users } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import {
  addGroupMember,
  createGroupEvent,
  fetchGroup,
  fetchGroupEvents,
  fetchGroupMembers,
  pauseGroupEvent,
  resumeGroupEvent,
  updateGroupEvent,
} from "@/lib/endpoints";
import type { GroupEvent, GroupMember, GroupSummary, RepetitionType } from "@/lib/types";

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
  const { showSuccess, showError } = useToast();

  const [group, setGroup] = useState<GroupSummary | null>(null);
  const [events, setEvents] = useState<GroupEvent[]>([]);
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
  const [eventDate, setEventDate] = useState("");
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
  const [editRepetitionType, setEditRepetitionType] = useState<RepetitionType>("NONE");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [pausingEventId, setPausingEventId] = useState<number | null>(null);

  function loadAll() {
    setIsLoading(true);
    Promise.all([fetchGroup(groupId), fetchGroupEvents(groupId), fetchGroupMembers(groupId)])
      .then(([groupData, eventsData, membersData]) => {
        setGroup(groupData);
        setEvents(eventsData);
        setMembers(membersData);
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

    const targetAmount = Number(eventTargetAmount);

    if (!eventTitle.trim() || !targetAmount || !eventDate || selectedMemberIds.length === 0) {
      setEventError("Titre, montant cible, date et au moins un membre sélectionné sont obligatoires.");
      return;
    }
    setEventError(null);
    setIsCreatingEvent(true);

    try {
      const created = await createGroupEvent(groupId, {
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        targetAmount,
        eventDate,
        groupMemberIds: selectedMemberIds,
        repetitionType: eventRepetitionType,
      });
      setEvents((current) => [...current, created]);
      showSuccess("Événement créé avec succès.");
      setEventTitle("");
      setEventDescription("");
      setEventTargetAmount("");
      setEventDate("");
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
    setEditTargetAmount(String(groupEvent.targetAmount));
    setEditDate(groupEvent.eventDate);
    setEditRepetitionType(groupEvent.repetitionType);
    setEditError(null);
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingEvent) return;

    const targetAmount = Number(editTargetAmount);
    if (!editTitle.trim() || !targetAmount || !editDate) {
      setEditError("Titre, montant et date sont obligatoires.");
      return;
    }
    setEditError(null);
    setIsSavingEdit(true);

    try {
      const updated = await updateGroupEvent(groupId, editingEvent.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        targetAmount,
        eventDate: editDate,
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

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{group.name}</h1>
      {group.description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{group.description}</p>
      )}
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        Propriétaire : {group.owner.fullName}
      </p>

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
                {member.registeredUser && (
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    Inscrit
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Événements */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Événements de cotisation</h2>

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Aucun événement pour l'instant.
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((groupEvent) => {
              const isUpcoming = new Date(groupEvent.eventDate) > new Date();
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
                        Échéance : {groupEvent.eventDate} — Objectif : {formatAmount(groupEvent.targetAmount)}
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
                  </div>
                </li>
              );
            })}
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

          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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
