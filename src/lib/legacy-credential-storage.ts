const LEGACY_KEYS = [
  "outinvoice-member-passwords",
  "outinvoice-admin-passwords",
  "settings:account:current-password",
  "settings:account:new-password",
  "settings:account:confirm-password",
];
const LEGACY_DRAFT_PREFIXES = ["member-form:", "admin-form:"];

/**
 * Removes passwords that older builds cached in sessionStorage (password caches and
 * form drafts that contained a temporary password field).
 */
export function purgeLegacyCredentialStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    for (const key of LEGACY_KEYS) {
      sessionStorage.removeItem(key);
    }
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (!key || !LEGACY_DRAFT_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        continue;
      }
      const raw = sessionStorage.getItem(key);
      if (raw && /"(temporaryPassword|password)"\s*:/.test(raw)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Storage may be unavailable (private mode, disabled storage).
  }
}
