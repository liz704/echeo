
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  ChevronRight,
  Mail,
  Pause,
  Pencil,
  Play,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useLocale } from "@/contexts/LocaleContext";
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
  updateMemberLocale,
  resumeGroupEvent,
  updateGroup,
  updateGroupEvent,
} from "@/lib/endpoints";
import type {
  GroupEvent,
  GroupMember,
  GroupPaymentHistoryItem,
  GroupSummary,
  RepetitionType,
} from "@/lib/types";
import { ReminderDaysPicker } from "@/components/ReminderDaysPicker";

const REPETITION_KEYS = [
  "NONE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
] as const;

function repetitionLabel(t: (k: string) => string, value: string) {
  const map: Record<string, string> = {
    NONE: t("forms.repetitionNone"),
    DAILY: t("forms.repetitionDaily"),
    WEEKLY: t("forms.repetitionWeekly"),
    MONTHLY: t("forms.repetitionMonthly"),
    YEARLY: t("forms.repetitionYearly"),
  };

  return map[value] ?? value;
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:text-sm";

const labelClass =
  "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200";

const errorClass =
  "break-words rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300";

function GroupDetailContent() {
  const params = useParams<{ groupId: string }>();
  const groupId = Number(params.groupId);
  const router = useRouter();

  const { showSuccess, showError } = useToast();
  const { t, dateLocale } = useLocale();

  const [group, setGroup] = useState<GroupSummary | null>(null);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [historyPayments, setHistoryPayments] = useState<
    GroupPaymentHistoryItem[]
  >([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ajout de membre
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberFullName, setMemberFullName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberLocale, setMemberLocale] = useState("");
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
  const [eventTime, setEventTime] = useState("");
  const [eventRepetitionType, setEventRepetitionType] =
    useState<RepetitionType>("NONE");
  const [eventReminderDays, setEventReminderDays] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // Modification d'événement
  const [editingEvent, setEditingEvent] = useState<GroupEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTargetAmount, setEditTargetAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editRepetitionType, setEditRepetitionType] =
    useState<RepetitionType>("NONE");
  const [editReminderDays, setEditReminderDays] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modification du groupe
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [editGroupError, setEditGroupError] = useState<string | null>(null);

  // Suppressions
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<GroupMember | null>(
    null
  );
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<GroupEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [pausingEventId, setPausingEventId] = useState<number | null>(null);

  async function handleSaveGroup() {
    if (!editGroupName.trim()) {
      setEditGroupError(t("msg.groupNameRequired"));
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
      showSuccess(t("groups.editGroupSuccess"));
      setIsEditGroupModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("msg.groupEditFailed");
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
      showSuccess(t("groups.deleteGroupSuccess"));
      router.push("/groups");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("msg.groupDeleteFailed");
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

      setMembers((current) =>
        current.filter((member) => member.id !== memberToDelete.id)
      );

      showSuccess(
        t("msg.memberRemoved", { name: memberToDelete.contactFullName })
      );

      setMemberToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("msg.memberRemoveFailed");
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

      setEvents((current) =>
        current.filter((event) => event.id !== eventToDelete.id)
      );

      showSuccess(t("msg.eventDeleted", { title: eventToDelete.title }));
      setEventToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("msg.eventDeleteFailed");
      showError(message);
    } finally {
      setIsDeletingEvent(false);
    }
  }

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
        const message =
          error instanceof Error ? error.message : t("msg.groupLoadFailed");
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
      setMemberError(t("msg.memberRequired"));
      return;
    }

    setMemberError(null);
    setIsAddingMember(true);

    try {
      const created = await addGroupMember(groupId, {
        fullName: memberFullName.trim(),
        email: memberEmail.trim(),
        phone: memberPhone.trim() || undefined,
        preferredLocale: memberLocale || undefined,
      });

      setMembers((current) => [...current, created]);
      showSuccess(t("groups.memberAdded"));

      setMemberFullName("");
      setMemberEmail("");
      setMemberPhone("");
      setMemberLocale("");
      setIsMemberModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("msg.memberAddFailed");
      setMemberError(message);
      showError(message);
    } finally {
      setIsAddingMember(false);
    }
  }

  function toggleMemberSelection(memberId: number) {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const targetAmount = eventHasMoney
      ? Number(eventTargetAmount)
      : undefined;

    if (
      !eventTitle.trim() ||
      (eventHasMoney && !targetAmount) ||
      !eventDate ||
      selectedMemberIds.length === 0
    ) {
      setEventError(
        eventHasMoney
          ? t("msg.eventRequiredMoney")
          : t("msg.eventRequiredNoMoney")
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
        withdrawalFeeAmount:
          eventHasMoney && eventWithdrawalFee
            ? Number(eventWithdrawalFee)
            : undefined,
        eventDate,
        eventTime: eventTime || undefined,
        groupMemberIds: selectedMemberIds,
        repetitionType: eventRepetitionType,
        reminderDaysBefore: eventReminderDays || undefined,
      });

      setEvents((current) => [...current, created]);
      showSuccess(t("groups.eventCreatedSuccess"));

      setEventTitle("");
      setEventDescription("");
      setEventTargetAmount("");
      setEventWithdrawalFee("");
      setEventHasMoney(true);
      setEventDate("");
      setEventTime("");
      setEventRepetitionType("NONE");
      setEventReminderDays("");
      setSelectedMemberIds([]);
      setIsEventModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("msg.eventCreateFailed");
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
    setEditTargetAmount(
      groupEvent.targetAmount != null
        ? String(groupEvent.targetAmount)
        : ""
    );
    setEditDate(groupEvent.eventDate);
    setEditTime(groupEvent.eventTime ? groupEvent.eventTime.slice(0, 5) : "");
    setEditRepetitionType(groupEvent.repetitionType);
    setEditReminderDays(groupEvent.reminderDaysBefore ?? "");
    setEditError(null);
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingEvent) return;

    const isWithMoney = editingEvent.targetAmount != null;
    const targetAmount = isWithMoney ? Number(editTargetAmount) : undefined;

    if (!editTitle.trim() || !editDate) {
      setEditError(t("msg.titleDateRequired"));
      return;
    }

    if (
      isWithMoney &&
      (!targetAmount || targetAmount < 0 || Number.isNaN(targetAmount))
    ) {
      setEditError(t("msg.targetRequired"));
      return;
    }

    setEditError(null);
    setIsSavingEdit(true);

    try {
      const updated = await updateGroupEvent(groupId, editingEvent.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        targetAmount: isWithMoney ? targetAmount : undefined,
        eventDate: editDate,
        withdrawalFeeAmount: isWithMoney
          ? editingEvent.withdrawalFeeAmount
          : undefined,
        eventTime: editTime || undefined,
        repetitionType: editRepetitionType,
        reminderDaysBefore: editReminderDays || undefined,
      });

      setEvents((current) =>
        current.map((event) => (event.id === updated.id ? updated : event))
      );

      showSuccess(t("groups.eventUpdatedSuccess"));
      setEditingEvent(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("msg.editFailed");
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

      setEvents((current) =>
        current.map((event) => (event.id === updated.id ? updated : event))
      );

      showSuccess(
        updated.paused
          ? t("groups.recurrencePaused")
          : t("groups.recurrenceResumed")
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("msg.actionFailed");
      showError(message);
    } finally {
      setPausingEventId(null);
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const upcomingEvents = events.filter((event) => event.eventDate >= todayStr);

  const pastEvents = events
    .filter((event) => event.eventDate < todayStr)
    .slice()
    .sort((a, b) => (a.eventDate < b.eventDate ? 1 : -1));

  const methodLabel = (method: string) => {
    const key = `payments.method.${method}`;
    const label = t(key);
    return label === key ? method : label;
  };

  if (isLoading || !group) {
    return <FullPageSpinner label={t("forms.loadingGroup")} />;
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
      {/* Retour et en-tête */}
      <Link
        href="/groups"
        className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        {t("groups.backToGroups")}
      </Link>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            {group.name}
          </h1>

          {group.description && (
            <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
              {group.description}
            </p>
          )}

          <p className="mt-1 break-words text-xs text-slate-400 dark:text-slate-500">
            {t("groups.owner")} : {group.owner.fullName}
          </p>
        </div>

        <div className="flex shrink-0 gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setEditGroupName(group.name);
              setEditGroupDescription(group.description ?? "");
              setIsEditGroupModalOpen(true);
            }}
            aria-label={t("forms.editGroup")}
            title={t("forms.editGroup")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteGroupModalOpen(true)}
            aria-label={t("forms.deleteGroup")}
            title={t("forms.deleteGroup")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Actions principales */}
      <div className="mt-5 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={() => {
            setMemberError(null);
            setIsMemberModalOpen(true);
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-4"
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          {t("groups.addMember")}
        </button>

        <button
          type="button"
          onClick={() => {
            setEventError(null);
            setIsEventModalOpen(true);
          }}
          disabled={members.length === 0}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
        >
          <CalendarPlus className="h-4 w-4 shrink-0" />
          {t("groups.newEvent")}
        </button>
      </div>

      {/* Membres */}
      <section className="mt-7 min-w-0 sm:mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Users className="h-5 w-5 shrink-0" />
          {t("groups.membersTitle")} ({members.length})
        </h2>

        {members.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {t("groups.noMembers")}
          </p>
        ) : (
          <ul className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium text-slate-900 dark:text-white">
                    {member.contactFullName}
                  </p>
                  <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                    {member.contactEmail}
                  </p>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0">
                  <select
                    value={member.preferredLocale ?? ""}
                    onChange={async (event) => {
                      try {
                        const updated = await updateMemberLocale(
                          groupId,
                          member.id,
                          event.target.value
                        );

                        setMembers((current) =>
                          current.map((item) =>
                            item.id === updated.id ? updated : item
                          )
                        );
                      } catch (error) {
                        showError(
                          error instanceof Error
                            ? error.message
                            : t("msg.actionFailed")
                        );
                      }
                    }}
                    aria-label={t("v2.memberLanguage")}
                    title={t("v2.memberLanguage")}
                    className="min-h-9 max-w-full rounded-md border border-slate-200 bg-transparent px-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    <option value="">{t("v2.langDefault")}</option>
                    <option value="fr">FR</option>
                    <option value="en">EN</option>
                  </select>

                  {member.registeredUser && (
                    <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      {t("ui.registered")}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setMemberToDelete(member)}
                    aria-label={t("forms.removeMember")}
                    title={t("forms.removeMember")}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Événements à venir */}
      <section className="mt-8 min-w-0">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          {t("groups.upcoming")}
        </h2>

        {upcomingEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:p-8">
            {t("groups.noUpcoming")}
          </div>
        ) : (
          <ul className="space-y-3">
            {upcomingEvents.map((groupEvent) => {
              const isRecurring = groupEvent.repetitionType !== "NONE";

              return (
                <li
                  key={groupEvent.id}
                  className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                >
                  <Link
                    href={`/groups/${groupId}/events/${groupEvent.id}`}
                    className="flex min-w-0 flex-1 items-start justify-between gap-3 transition hover:opacity-80 sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="break-words font-medium text-slate-900 dark:text-white">
                          {groupEvent.title}
                        </p>

                        {isRecurring && (
                          <span
                            className={`max-w-full rounded-full px-2 py-1 text-xs font-medium ${
                              groupEvent.paused
                                ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {repetitionLabel(t, groupEvent.repetitionType)}
                            {groupEvent.paused
                              ? ` (${t("ui.paused")})`
                              : ""}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {t("forms.due")} : {groupEvent.eventDate}
                        {groupEvent.eventTime
                          ? ` ${t("reminders.atTime")} ${groupEvent.eventTime.slice(0, 5)}`
                          : ""}
                        {groupEvent.targetAmount != null
                          ? ` — ${t("forms.objective")} : ${formatAmount(groupEvent.targetAmount)}`
                          : ` — ${t("ui.infoNoMoney")}`}
                      </p>
                    </div>

                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 sm:mt-0" />
                  </Link>

                  <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800 sm:border-0 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(groupEvent)}
                      aria-label={t("groups.editEvent")}
                      title={t("groups.editEventTitle")}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {isRecurring && (
                      <button
                        type="button"
                        onClick={() => handleTogglePause(groupEvent)}
                        disabled={pausingEventId === groupEvent.id}
                        aria-label={
                          groupEvent.paused
                            ? t("groups.resumeRecurrence")
                            : t("groups.pauseRecurrence")
                        }
                        title={
                          groupEvent.paused
                            ? t("groups.resumeRecurrenceTitle")
                            : t("groups.pauseRecurrenceTitle")
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
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
                      aria-label={t("groups.deleteEvent")}
                      title={t("groups.deleteEvent")}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
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

      {/* Historique */}
      <section className="mt-9 min-w-0 sm:mt-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("groups.historyTitle")}
        </h2>

        <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          {t("groups.pastEvents")}
        </h3>

        {pastEvents.length === 0 ? (
          <div className="mb-6 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {t("groups.noPast")}
          </div>
        ) : (
          <ul className="mb-6 space-y-2">
            {pastEvents.map((groupEvent) => (
              <li key={groupEvent.id}>
                <Link
                  href={`/groups/${groupId}/events/${groupEvent.id}`}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:opacity-80 dark:border-slate-800 dark:bg-slate-900 sm:p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium text-slate-900 dark:text-white">
                      {groupEvent.title}
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {t("forms.due")} : {groupEvent.eventDate}
                      {groupEvent.targetAmount != null
                        ? ` — ${t("forms.objective")} : ${formatAmount(groupEvent.targetAmount)}`
                        : ` — ${t("ui.infoNoMoney")}`}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          {t("groups.recordedPayments")}
        </h3>

        {historyPayments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {t("groups.noPayments")}
          </div>
        ) : (
          <ul className="space-y-3">
            {historyPayments.map((payment) => (
              <li
                key={payment.id}
                className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4"
              >
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium text-slate-900 dark:text-white">
                      {payment.memberFullName ?? t("groups.memberFallback")} —{" "}
                      {formatAmount(payment.amountPaid)}
                    </p>

                    <p className="mt-1 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {payment.eventTitle ?? t("ui.event")}
                      {" · "}
                      {methodLabel(payment.paymentMethod)}
                      {" · "}
                      {new Date(payment.paidAt).toLocaleString(dateLocale)}
                      {payment.transactionRef
                        ? ` · ${t("ui.ref")} ${payment.transactionRef}`
                        : ""}
                    </p>
                  </div>

                  {payment.eventId != null && (
                    <Link
                      href={`/groups/${groupId}/events/${payment.eventId}`}
                      className="inline-flex min-h-9 items-center self-start text-sm font-medium text-teal-700 hover:underline dark:text-teal-400 sm:self-center"
                    >
                      {t("groups.seeEvent")}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modale : ajout d'un membre */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        title={t("groups.addMember")}
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className={labelClass}>{t("auth.fullName")}</label>
            <input
              type="text"
              required
              autoComplete="name"
              placeholder={t("forms.placeholderName")}
              value={memberFullName}
              onChange={(event) => setMemberFullName(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t("forms.email")}</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder={t("forms.placeholderEmail")}
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {t("forms.phone")}{" "}
              <span className="font-normal text-slate-400">
                {t("forms.optional")}
              </span>
            </label>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+237 6XX XXX XXX"
              value={memberPhone}
              onChange={(event) => setMemberPhone(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              {t("v2.memberLanguage")}{" "}
              <span className="font-normal text-slate-400">
                {t("forms.optional")}
              </span>
            </label>

            <select
              value={memberLocale}
              onChange={(event) => setMemberLocale(event.target.value)}
              className={inputClass}
            >
              <option value="">{t("v2.langDefault")}</option>
              <option value="fr">{t("v2.langFr")}</option>
              <option value="en">{t("v2.langEn")}</option>
            </select>

            <p className="mt-1 text-xs text-slate-400">
              {t("v2.memberLanguageHint")}
            </p>
          </div>

          <p className="text-xs text-slate-400">
            {t("ui.memberNoAccount")}
          </p>

          {memberError && (
            <p role="alert" className={errorClass}>
              {memberError}
            </p>
          )}

          <button
            type="submit"
            disabled={isAddingMember}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isAddingMember && <Spinner size={16} />}
            {t("forms.addMember")}
          </button>
        </form>
      </Modal>

      {/* Modale : création d'événement */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={t("groups.newEvent")}
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className={labelClass}>{t("forms.title")}</label>
            <input
              type="text"
              required
              placeholder={t("forms.placeholderTitle")}
              value={eventTitle}
              onChange={(event) => setEventTitle(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              {t("forms.description")}{" "}
              <span className="font-normal text-slate-400">
                {t("forms.optional")}
              </span>
            </label>
            <textarea
              value={eventDescription}
              onChange={(event) => setEventDescription(event.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>

          <div>
            <span className={labelClass}>{t("forms.eventType")}</span>
            <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
              <button
                type="button"
                onClick={() => setEventHasMoney(true)}
                aria-pressed={eventHasMoney}
                className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  eventHasMoney
                    ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                    : "border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                {t("forms.withMoney")}
              </button>

              <button
                type="button"
                onClick={() => setEventHasMoney(false)}
                aria-pressed={!eventHasMoney}
                className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  !eventHasMoney
                    ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                    : "border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                {t("forms.withoutMoney")}
              </button>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {eventHasMoney && (
              <div className="min-w-0">
                <label className={labelClass}>
                  {t("v2.amountPerMember")}
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  placeholder={t("ui.example", { value: "5000" })}
                  value={eventTargetAmount}
                  onChange={(event) =>
                    setEventTargetAmount(event.target.value)
                  }
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">
                  {t("v2.amountPerMemberHint")}
                </p>
              </div>
            )}

            {eventHasMoney && (
              <div className="min-w-0">
                <label className={labelClass}>
                  {t("forms.withdrawalFee")}{" "}
                  <span className="font-normal text-slate-400">
                    {t("forms.optional")}
                  </span>
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder={t("ui.example", { value: "300" })}
                  value={eventWithdrawalFee}
                  onChange={(event) =>
                    setEventWithdrawalFee(event.target.value)
                  }
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">
                  {t("forms.withdrawalFeeHint")}
                </p>

                {Number(eventTargetAmount) > 0 &&
                  Number(eventWithdrawalFee) > 0 && (
                    <p className="mt-1 break-words text-xs font-medium text-teal-700 dark:text-teal-300">
                      {t("v2.feePreview", {
                        total:
                          Number(eventTargetAmount) +
                          Number(eventWithdrawalFee),
                        amount: Number(eventTargetAmount),
                        fee: Number(eventWithdrawalFee),
                      })}
                    </p>
                  )}
              </div>
            )}

            <div className="min-w-0">
              <label className={labelClass}>{t("forms.eventDate")}</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="min-w-0">
              <label className={labelClass}>
                {t("forms.reminderTime")} {t("forms.reminderTimeHint")}
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(event) => setEventTime(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {t("reminders.repetition")}
            </label>
            <select
              value={eventRepetitionType}
              onChange={(event) =>
                setEventRepetitionType(
                  event.target.value as RepetitionType
                )
              }
              className={inputClass}
            >
              {REPETITION_KEYS.map((value) => (
                <option key={value} value={value}>
                  {repetitionLabel(t, value)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              {t("forms.recurrenceHint")}
            </p>
          </div>

          <ReminderDaysPicker
            value={eventReminderDays}
            onChange={setEventReminderDays}
          />

          <div>
            <label className={labelClass}>
              {t("forms.membersConcerned")}
            </label>

            <div className="max-h-52 space-y-1 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              {members.map((member) => (
                <label
                  key={member.id}
                  className="flex min-w-0 cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(member.id)}
                    onChange={() => toggleMemberSelection(member.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-slate-700 dark:text-slate-200">
                      {member.contactFullName}
                    </span>
                    <span className="mt-0.5 block break-all text-xs text-slate-400">
                      {member.contactEmail}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {t("ui.targetSplit")}
            </p>
          </div>

          {eventError && (
            <p role="alert" className={errorClass}>
              {eventError}
            </p>
          )}

          <button
            type="submit"
            disabled={isCreatingEvent}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isCreatingEvent && <Spinner size={16} />}
            {t("forms.createEvent")}
          </button>
        </form>
      </Modal>

      {/* Modale : modification d'événement */}
      <Modal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        title={t("ui.editTitleWith", {
          title: editingEvent?.title ?? "",
        })}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className={labelClass}>{t("forms.title")}</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t("forms.description")}</label>
            <textarea
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>

          <div
            className={`grid min-w-0 grid-cols-1 gap-3 ${
              editingEvent?.targetAmount != null
                ? "sm:grid-cols-3"
                : "sm:grid-cols-2"
            }`}
          >
            {editingEvent?.targetAmount != null && (
              <div className="min-w-0">
                <label className={labelClass}>
                  {t("forms.targetAmount")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={editTargetAmount}
                  onChange={(event) =>
                    setEditTargetAmount(event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            )}

            <div className="min-w-0">
              <label className={labelClass}>{t("forms.date")}</label>
              <input
                type="date"
                required
                value={editDate}
                onChange={(event) => setEditDate(event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="min-w-0">
              <label className={labelClass}>
                {t("forms.time")} {t("forms.optional")}
              </label>
              <input
                type="time"
                value={editTime}
                onChange={(event) => setEditTime(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {t("reminders.repetition")}
            </label>
            <select
              value={editRepetitionType}
              onChange={(event) =>
                setEditRepetitionType(
                  event.target.value as RepetitionType
                )
              }
              className={inputClass}
            >
              {REPETITION_KEYS.map((value) => (
                <option key={value} value={value}>
                  {repetitionLabel(t, value)}
                </option>
              ))}
            </select>
          </div>

          <ReminderDaysPicker
            value={editReminderDays}
            onChange={setEditReminderDays}
          />

          {editError && (
            <p role="alert" className={errorClass}>
              {editError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSavingEdit}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isSavingEdit && <Spinner size={16} />}
            {t("forms.save")}
          </button>
        </form>
      </Modal>

      {/* Modale : modification du groupe */}
      <Modal
        isOpen={isEditGroupModalOpen}
        onClose={() => {
          setIsEditGroupModalOpen(false);
          setEditGroupError(null);
        }}
        title={t("forms.editGroup")}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSaveGroup();
          }}
        >
          <div>
            <label className={labelClass}>{t("groups.name")}</label>
            <input
              type="text"
              required
              value={editGroupName}
              onChange={(event) => setEditGroupName(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              {t("forms.description")}{" "}
              <span className="font-normal text-slate-400">
                {t("forms.optional")}
              </span>
            </label>
            <textarea
              value={editGroupDescription}
              onChange={(event) =>
                setEditGroupDescription(event.target.value)
              }
              rows={3}
              className={inputClass}
            />
          </div>

          {editGroupError && (
            <p role="alert" className={errorClass}>
              {editGroupError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSavingGroup}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isSavingGroup && <Spinner size={16} />}
            {t("forms.save")}
          </button>
        </form>
      </Modal>

      {/* Confirmation : suppression du groupe */}
      <ConfirmModal
        isOpen={isDeleteGroupModalOpen}
        title={t("groups.deleteTitle")}
        description={t("ui.deleteGroupDesc", {
          name: group?.name ?? "",
        })}
        confirmLabel={t("common.delete")}
        isDangerous
        isLoading={isDeletingGroup}
        onConfirm={handleConfirmDeleteGroup}
        onCancel={() => setIsDeleteGroupModalOpen(false)}
      />

      {/* Confirmation : suppression d'un membre */}
      <ConfirmModal
        isOpen={!!memberToDelete}
        title={t("ui.removeMemberTitle")}
        description={t("ui.removeMemberDesc", {
          name: memberToDelete?.contactFullName ?? "",
        })}
        confirmLabel={t("ui.removeMemberCta")}
        isDangerous
        isLoading={isDeletingMember}
        onConfirm={handleConfirmDeleteMember}
        onCancel={() => setMemberToDelete(null)}
      />

      {/* Confirmation : suppression d'un événement */}
      <ConfirmModal
        isOpen={!!eventToDelete}
        title={t("groups.deleteEvent") + " ?"}
        description={t("ui.deleteEventDesc", {
          title: eventToDelete?.title ?? "",
        })}
        confirmLabel={t("common.delete")}
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
