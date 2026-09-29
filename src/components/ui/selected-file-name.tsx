export function SelectedFileName({ fileName, busy }: { fileName: string | null; busy: boolean }) {
  if (!fileName) {
    return null;
  }
  return (
    <p className="mt-2 truncate text-xs text-muted" title={fileName}>
      {busy ? "Uploading" : "Selected (not saved yet)"}:{" "}
      <span className="font-medium text-foreground">{fileName}</span>
    </p>
  );
}
