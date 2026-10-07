"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { apiClient } from "@/lib/api";

type Row = { title: string; dueDate: string; dueTime: string };

export default function WeekPlanPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [fullName, setFullName] = useState("");
  const [locale, setLocale] = useState("fr");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [defaultTime, setDefaultTime] = useState("08:00");
  const [rows, setRows] = useState<Row[]>([{ title: "", dueDate: "", dueTime: "" }]);

  const en = locale === "en";

  useEffect(() => {
    apiClient
      .get<{ fullName: string; locale: string }>(`/public/week-plan/${token}`)
      .then((r) => {
        setFullName(r.data.fullName);
        setLocale(r.data.locale || "fr");
      })
      .catch(() => setError(en ? "Invalid or expired link." : "Lien invalide ou expiré."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const tasks = rows
      .filter((r) => r.title.trim() && r.dueDate)
      .map((r) => ({
        title: r.title.trim(),
        dueDate: r.dueDate,
        dueTime: r.dueTime || null,
      }));
    if (tasks.length === 0) {
      setError(en ? "Add at least one task with a date." : "Ajoute au moins une tâche avec une date.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/public/week-plan/${token}`, {
        tasks,
        defaultTime: defaultTime || "08:00",
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <FullPageSpinner label="..." />;

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-900">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {en ? "Tasks saved" : "Tâches enregistrées"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {en
              ? "They were added to your ÉCHÉO reminders."
              : "Elles ont été ajoutées à tes rappels ÉCHÉO."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        {en ? "Weekly tasks" : "Tâches de la semaine"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {en ? `Hi ${fullName}, add your tasks below.` : `Bonjour ${fullName}, ajoute tes tâches ci-dessous.`}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            {en ? "Default time if empty" : "Heure par défaut si vide"}
          </label>
          <input
            type="time"
            value={defaultTime}
            onChange={(e) => setDefaultTime(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {rows.map((row, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <input
              type="text"
              placeholder={en ? "Task title" : "Titre de la tâche"}
              value={row.title}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...next[i], title: e.target.value };
                setRows(next);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={row.dueDate}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...next[i], dueDate: e.target.value };
                  setRows(next);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <input
                type="time"
                value={row.dueTime}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...next[i], dueTime: e.target.value };
                  setRows(next);
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
                className="inline-flex items-center gap-1 text-xs text-red-500"
              >
                <Trash2 className="h-3 w-3" /> {en ? "Remove" : "Retirer"}
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setRows([...rows, { title: "", dueDate: "", dueTime: "" }])}
          className="inline-flex items-center gap-1 text-sm font-medium text-teal-600"
        >
          <Plus className="h-4 w-4" /> {en ? "Add a task" : "Ajouter une tâche"}
        </button>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {submitting && <Spinner size={16} />}
          {en ? "Save my tasks" : "Enregistrer mes tâches"}
        </button>
      </form>
    </main>
  );
}
