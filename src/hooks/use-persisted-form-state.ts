"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

function readDraft<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeDraft<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors.
  }
}

export function getFormDraft<T>(key: string): T | null {
  return readDraft<T>(key);
}

export function clearFormDraft(key: string): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(key);
}

export function clearFormDrafts(keys: string[]): void {
  for (const key of keys) {
    clearFormDraft(key);
  }
}

export function usePersistedFormState<T>(
  storageKey: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const [state, setState] = useState<T>(() => readDraft<T>(storageKey) ?? initialValue);

  useEffect(() => {
    setState(readDraft<T>(storageKey) ?? initialValue);
    // Only reset when the form identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    writeDraft(storageKey, state);
  }, [state, storageKey]);

  const clearDraft = useCallback(() => {
    clearFormDraft(storageKey);
  }, [storageKey]);

  return [state, setState, clearDraft];
}
