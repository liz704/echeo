"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Trash2, Users } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { useLocale } from "@/contexts/LocaleContext";
import { useToast } from "@/contexts/ToastContext";
import { createGroup, deleteGroup, fetchMyGroups } from "@/lib/endpoints";
import type { GroupSummary } from "@/lib/types";

function GroupsContent() {
  const { t } = useLocale();
  const { showSuccess, showError } = useToast();

  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<GroupSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function loadGroups() {
    setIsLoading(true);
    fetchMyGroups()
      .then(setGroups)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : t("common.error");
        showError(message);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setCreateError(t("groups.name"));
      return;
    }
    setCreateError(null);
    setIsCreating(true);
    try {
      await createGroup({ name: name.trim(), description: description.trim() || undefined });
      showSuccess(t("groups.createCta"));
      setName("");
      setDescription("");
      setIsModalOpen(false);
      loadGroups();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.error");
      setCreateError(message);
      showError(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!groupToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGroup(groupToDelete.id);
      setGroups((current) => current.filter((g) => g.id !== groupToDelete.id));
      showSuccess(t("common.delete"));
      setGroupToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("common.error");
      showError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <FullPageSpinner label={t("common.loading")} />;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("groups.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("groups.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("groups.newGroup")}</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <Users className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("groups.empty")}</p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            {t("groups.newGroup")}
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {groups.map((group) => (
            <li
              key={group.id}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-900"
            >
              <Link
                href={`/groups/${group.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  <Users className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {group.name}
                  </p>
                  {group.description && (
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {group.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
              <button
                type="button"
                onClick={() => setGroupToDelete(group)}
                aria-label={t("common.delete")}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("groups.createTitle")}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("groups.name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("groups.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          {createError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {createError}
            </p>
          )}
          <button
            type="submit"
            disabled={isCreating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {isCreating && <Spinner size={16} />}
            {t("groups.createCta")}
          </button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!groupToDelete}
        title={t("groups.deleteTitle")}
        description={t("groups.deleteDesc")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        isDangerous
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setGroupToDelete(null)}
      />
    </main>
  );
}

export default function GroupsPage() {
  return (
    <AuthGuard>
      <AppNavbar />
      <GroupsContent />
    </AuthGuard>
  );
}
