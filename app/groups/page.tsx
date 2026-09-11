"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { createGroup, fetchMyGroups } from "@/lib/endpoints";
import type { GroupSummary } from "@/lib/types";

function GroupsContent() {
  const { showSuccess, showError } = useToast();

  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyGroups()
      .then(setGroups)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Impossible de charger tes groupes.";
        showError(message);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setCreateError("Le nom du groupe est obligatoire.");
      return;
    }
    setCreateError(null);
    setIsCreating(true);

    try {
      const created = await createGroup({ name: name.trim(), description: description.trim() || undefined });
      setGroups((current) => [created, ...current]);
      showSuccess("Groupe créé avec succès.");
      setName("");
      setDescription("");
      setIsModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de la création du groupe.";
      setCreateError(message);
      showError(message);
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return <FullPageSpinner label="Chargement de tes groupes..." />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mes groupes</h1>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Nouveau groupe
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Tu ne fais partie d'aucun groupe pour l'instant. Crée-en un pour commencer à organiser des cotisations.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/groups/${group.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-700"
              >
                <p className="font-semibold text-slate-900 dark:text-white">{group.name}</p>
                {group.description && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{group.description}</p>
                )}
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                  Propriétaire : {group.owner.fullName}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau groupe">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Nom du groupe
            </label>
            <input
              type="text"
              placeholder="Ex : Cotisation mariage Awa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Description <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <textarea
              placeholder="Détails du groupe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {createError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {createError}
            </p>
          )}

          <button
            type="submit"
            disabled={isCreating}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            {isCreating && <Spinner size={16} />}
            Créer le groupe
          </button>
        </form>
      </Modal>
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
