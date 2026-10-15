// Verrouillage de l'application par code PIN (stocké en empreinte SHA-256 sur l'appareil).
// C'est un verrou d'accès à l'interface sur cet appareil ; il ne remplace pas le mot de passe du compte.

const PIN_KEY = "echeo_app_pin_hash";
const UNLOCK_KEY = "echeo_app_unlocked";

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(`echeo-lock:${text}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

export function isLockEnabled(): boolean {
  try {
    return !!window.localStorage.getItem(PIN_KEY);
  } catch {
    return false;
  }
}

export function isUnlocked(): boolean {
  try {
    return window.sessionStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return true;
  }
}

export async function enableLock(pin: string): Promise<void> {
  window.localStorage.setItem(PIN_KEY, await sha256(pin));
  window.sessionStorage.setItem(UNLOCK_KEY, "1");
}

export async function checkPin(pin: string): Promise<boolean> {
  const stored = window.localStorage.getItem(PIN_KEY);
  if (!stored) return true;
  return stored === (await sha256(pin));
}

export async function disableLock(pin: string): Promise<boolean> {
  if (!(await checkPin(pin))) return false;
  window.localStorage.removeItem(PIN_KEY);
  window.sessionStorage.removeItem(UNLOCK_KEY);
  return true;
}

export async function unlock(pin: string): Promise<boolean> {
  if (!(await checkPin(pin))) return false;
  window.sessionStorage.setItem(UNLOCK_KEY, "1");
  return true;
}

export function lockNow(): void {
  try {
    window.sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    /* ignoré */
  }
}
