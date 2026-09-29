"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Local preview + pending file for an image picked in a file input, held until the user saves it. */
export function useSelectedImage() {
  const objectUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const revoke = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const select = useCallback(
    (next: File) => {
      revoke();
      const url = URL.createObjectURL(next);
      objectUrlRef.current = url;
      setFile(next);
      setPreviewUrl(url);
      setFileName(next.name);
    },
    [revoke],
  );

  const reset = useCallback(() => {
    revoke();
    setFile(null);
    setPreviewUrl(null);
    setFileName(null);
  }, [revoke]);

  useEffect(() => revoke, [revoke]);

  return { file, previewUrl, fileName, select, reset };
}
