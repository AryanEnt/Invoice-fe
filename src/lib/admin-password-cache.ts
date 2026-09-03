const STORAGE_KEY = "outinvoice-admin-passwords";

function readCache(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, string>): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export function setCachedAdminPassword(adminId: string, password: string): void {
  const cache = readCache();
  cache[adminId] = password;
  writeCache(cache);
}

export function getCachedAdminPasswords(): Record<string, string> {
  return readCache();
}
