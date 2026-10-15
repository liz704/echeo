"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Moon,
  Phone,
  Save,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppNavbar } from "@/components/AppNavbar";
import { Collapsible } from "@/components/ui/Collapsible";
import { AppLockPanel } from "@/components/AppLockPanel";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocale } from "@/contexts/LocaleContext";
import { changeMyPassword, fetchMyProfile, updateMyProfile, updateWeekPlanSettings } from "@/lib/endpoints";
import type { UserProfile } from "@/lib/types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SettingsContent() {
  const { showSuccess, showError } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { t, locale, dateLocale, setLocale } = useLocale();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLocale, setPreferredLocale] = useState("fr");
  const [weekPlanEnabled, setWeekPlanEnabled] = useState(false);
  const [weekPlanDay, setWeekPlanDay] = useState(1);
  const [weekPlanSendTime, setWeekPlanSendTime] = useState("08:00");
  const [isSavingWeekPlan, setIsSavingWeekPlan] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const data = await fetchMyProfile();
        if (isMounted) {
          setProfile(data);
          setFullName(data.fullName);
          setPreferredLocale(data.preferredLocale === "en" ? "en" : "fr");
          setWeekPlanEnabled(!!data.weekPlanEnabled);
          setWeekPlanDay(data.weekPlanDay ?? 1);
          setWeekPlanSendTime((data.weekPlanSendTime || "08:00").slice(0, 5));
          setPhone(data.phone ?? "");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : t("msg.loadProfileFailed");
        showError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profileDirty = useMemo(() => {
    if (!profile) return false;
    return fullName.trim() !== profile.fullName || (phone.trim() || "") !== (profile.phone ?? "") || preferredLocale !== (profile.preferredLocale === "en" ? "en" : "fr");
  }, [profile, fullName, phone, preferredLocale]);

  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/\d/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  }, [newPassword]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim()) {
      setProfileError(t("auth.fullNameRequired"));
      return;
    }
    setProfileError(null);
    setIsSavingProfile(true);

    try {
      const updated = await updateMyProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      setProfile(updated);
      showSuccess(t("settings.profileUpdated"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("msg.updateProfileFailed");
      setProfileError(message);
      showError(message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordError(t("msg.allFieldsRequired"));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t("auth.passwordMin"));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(t("msg.confirmationMismatch"));
      return;
    }
    setPasswordError(null);
    setIsSavingPassword(true);

    try {
      await changeMyPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      showSuccess(t("settings.passwordChanged"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("msg.changePasswordFailed");
      setPasswordError(message);
      showError(message);
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isLoading || !profile) {
    return <FullPageSpinner label={t("settings.loadingSettings")} />;
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const strengthLabel = ["", t("settings.weak"), t("settings.medium"), t("settings.good"), t("settings.strong")][passwordStrength] ?? "";
  const strengthColor =
    passwordStrength <= 1
      ? "bg-red-500"
      : passwordStrength === 2
        ? "bg-amber-500"
        : passwordStrength === 3
          ? "bg-teal-500"
          : "bg-emerald-500";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Carte identité */}
      <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-8 dark:from-teal-700 dark:to-teal-900">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold text-white ring-2 ring-white/30 backdrop-blur">
              {getInitials(profile.fullName)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-white">{profile.fullName}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-teal-100">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {profile.email}
              </p>
              {memberSince && (
                <p className="mt-1 text-xs text-teal-200/80">{t("settings.memberSince", { date: memberSince })}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Profil */}
      <Collapsible className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 mb-6" header={<>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
            <User className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t("settings.profile")}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("settings.profileHint")}
            </p>
          </div>
        </div>
      </>}>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("ui.emailAddress")}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">{t("settings.emailLocked")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("settings.fullName")}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("ui.fullNamePlaceholder")}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("settings.phone")}
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {profileError && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
            >
              {profileError}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingProfile || !profileDirty}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingProfile ? <Spinner size={16} /> : profileDirty ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {profileDirty ? t("common.save") : t("common.upToDate")}
            </button>
          </div>
        </form>
      </Collapsible>


      {/* Langue des e-mails */}
      <Collapsible className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 mb-6" header={<>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("settings.emailLanguage")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("settings.emailLanguageHint")}
          </p>
        </div>
      </>}>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPreferredLocale("fr")}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
              preferredLocale === "fr"
                ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {t("settings.languageFr")}
          </button>
          <button
            type="button"
            onClick={() => setPreferredLocale("en")}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
              preferredLocale === "en"
                ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {t("settings.languageEn")}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {t("settings.emailLanguageSaveHint")}
        </p>
      </Collapsible>

      
      {/* Planification hebdomadaire */}
      <Collapsible className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 mb-6" header={<>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("weekPlan.settingsTitle")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("weekPlan.settingsHint")}
          </p>
        </div>
      </>}>
        <label className="mb-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={weekPlanEnabled}
            onChange={(e) => setWeekPlanEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-600"
          />
          {t("weekPlan.enabled")}
        </label>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">{t("weekPlan.day")}</label>
            <select
              value={weekPlanDay}
              onChange={(e) => setWeekPlanDay(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {t(`weekPlan.days.${d}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">{t("weekPlan.sendTime")}</label>
            <input
              type="time"
              value={weekPlanSendTime}
              onChange={(e) => setWeekPlanSendTime(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <button
          type="button"
          disabled={isSavingWeekPlan}
          onClick={async () => {
            setIsSavingWeekPlan(true);
            try {
              const updated = await updateWeekPlanSettings({
                enabled: weekPlanEnabled,
                day: weekPlanDay,
                sendTime: weekPlanSendTime,
              });
              setProfile(updated);
              showSuccess(t("common.save"));
            } catch (e) {
              showError(e instanceof Error ? e.message : t("common.error"));
            } finally {
              setIsSavingWeekPlan(false);
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {isSavingWeekPlan ? <Spinner size={16} /> : null}
          {t("common.save")}
        </button>
      </Collapsible>

{/* Apparence */}
      <Collapsible className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 mb-6" header={<>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t("settings.appearance")}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("settings.appearanceHint")}</p>
          </div>
        </div>
      </>}>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              if (theme !== "light") toggleTheme();
            }}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-medium transition ${
              theme === "light"
                ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            <Sun className="h-5 w-5" />
            {t("settings.themeLight")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (theme !== "dark") toggleTheme();
            }}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-medium transition ${
              theme === "dark"
                ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            <Moon className="h-5 w-5" />
            {t("settings.themeDark")}
          </button>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
          <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("common.language")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLocale("fr")}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                locale === "fr"
                  ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                  : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              {t("common.french")}
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                locale === "en"
                  ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                  : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              {t("common.english")}
            </button>
          </div>
        </div>
      </Collapsible>

      {/* Sécurité */}
      <Collapsible className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900" header={<>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <Shield className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t("v2.securityApp")}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("v2.securityAppHint")}</p>
          </div>
        </div>
      </>}>

        <AppLockPanel />

        <Collapsible
          className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-700"
          header={
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <KeyRound className="h-4 w-4" />
              {t("v2.passwordSection")}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{t("settings.securityHint")}</span>
            </span>
          }
        >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("settings.currentPassword")}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={showCurrent ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("settings.newPassword")}
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showNew ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2">
                  <div className="mb-1 flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition ${
                          passwordStrength >= level ? strengthColor : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("settings.passwordStrength")} : {strengthLabel}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("settings.confirmPassword")}
              </label>
              <input
                type={showNew ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {passwordError && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
            >
              {passwordError}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {isSavingPassword ? <Spinner size={16} /> : <KeyRound className="h-4 w-4" />}
              {t("settings.updatePassword")}
            </button>
          </div>
        </form>
        </Collapsible>
      </Collapsible>
    
      {/* À propos */}
      <Collapsible className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 mt-6" header={<>
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("about.title")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("about.subtitle")}
          </p>
        </div>
      </>}>

        <div className="space-y-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <div>
            <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{t("about.whatTitle")}</h3>
            <p>{t("about.whatBody")}</p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{t("about.remindersTitle")}</h3>
            <p>{t("about.remindersBody")}</p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{t("about.groupsTitle")}</h3>
            <p>{t("about.groupsBody")}</p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{t("about.moneyTitle")}</h3>
            <p>{t("about.moneyBody")}</p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{t("about.noMoneyTitle")}</h3>
            <p>{t("about.noMoneyBody")}</p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{t("about.weekTitle")}</h3>
            <p>{t("about.weekBody")}</p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{t("about.langTitle")}</h3>
            <p>{t("about.langBody")}</p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{t("about.tipsTitle")}</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("about.tip1")}</li>
              <li>{t("about.tip2")}</li>
              <li>{t("about.tip3")}</li>
            </ul>
          </div>
          <p className="border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800">
            {t("about.version")}
          </p>
        </div>
      </Collapsible>

    </main>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <AppNavbar />
      <SettingsContent />
    </AuthGuard>
  );
}
