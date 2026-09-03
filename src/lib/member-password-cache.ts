const STORAGE_KEY = "outinvoice-member-passwords";

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

export function getCachedMemberPassword(memberId: string): string | null {
  return readCache()[memberId] ?? null;
}

export function setCachedMemberPassword(memberId: string, password: string): void {
  const cache = readCache();
  cache[memberId] = password;
  writeCache(cache);
}

export function getCachedMemberPasswords(): Record<string, string> {
  return readCache();
}
