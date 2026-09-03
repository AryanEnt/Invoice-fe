"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { ApiError } from "@/lib/api/types";
import { useToast } from "@/providers/toast-provider";
import {
  getEmailTemplates,
  saveEmailTemplates,
  type EmailTemplatePair,
  type EmailTemplateSettings,
} from "@/services/settings.service";

const SAMPLE = {
  customerName: "John Doe",
  invoiceNumber: "INV-2026-0042",
  total: "NPR 25,000",
  dueDate: "September 10, 2026",
  paymentDate: "September 1, 2026",
  companyName: "ABC Company",
  companyEmail: "billing@abccompany.com",
} as const;

type TemplateKind = "unpaid" | "paid";

const TEMPLATE_ORDER: TemplateKind[] = ["unpaid", "paid"];

const TEMPLATE_META: Record<
  TemplateKind,
  { name: string; description: string; ctaHint: string }
> = {
  unpaid: {
    name: "Unpaid Invoice",
    description: "Sent when an invoice is emailed and remains unpaid.",
    ctaHint: "Pay Invoice",
  },
  paid: {
    name: "Paid Invoice",
    description: "Sent when payment has been successfully received.",
    ctaHint: "View Invoice",
  },
};

function fillPlaceholders(value: string): string {
  return value
    .replaceAll("{{customerName}}", SAMPLE.customerName)
    .replaceAll("{{invoiceNumber}}", SAMPLE.invoiceNumber)
    .replaceAll("{{total}}", SAMPLE.total)
    .replaceAll("{{dueDate}}", SAMPLE.dueDate)
    .replaceAll("{{paymentDate}}", SAMPLE.paymentDate)
    .replaceAll("{{companyName}}", SAMPLE.companyName);
}

function formatSource(template: EmailTemplatePair): string {
  return `Subject: ${template.subject}\n\n${template.body}`;
}

function EmailPreview({
  kind,
  subject,
  body,
}: {
  kind: TemplateKind;
  subject: string;
  body: string;
}) {
  const filledSubject = fillPlaceholders(subject);
  const filledBody = fillPlaceholders(body);
  const lines = filledBody.split("\n");
  const ctaLabel = TEMPLATE_META[kind].ctaHint;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#f4f5f6]">
      <div className="border-b border-border bg-surface px-4 py-3 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Email preview</p>
        <div className="mt-3 space-y-1.5 text-sm">
          <p>
            <span className="text-muted">From:</span>{" "}
            <span className="font-medium text-foreground">
              {SAMPLE.companyName} &lt;{SAMPLE.companyEmail}&gt;
            </span>
          </p>
          <p>
            <span className="text-muted">To:</span>{" "}
            <span className="font-medium text-foreground">
              {SAMPLE.customerName} &lt;john.doe@example.com&gt;
            </span>
          </p>
          <p>
            <span className="text-muted">Subject:</span>{" "}
            <span className="font-medium text-foreground">{filledSubject}</span>
          </p>
        </div>
      </div>

      <div className="px-3 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-[640px] overflow-hidden rounded-2xl border border-[#e6e7e8] bg-white shadow-sm">
          <div className="px-6 py-8 text-center sm:px-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f8f9] text-sm font-semibold tracking-wide text-[#141517]">
              ABC
            </div>
            <p className="text-[15px] font-semibold tracking-wide text-[#141517]">
              {SAMPLE.companyName}
            </p>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#141517]">
              {kind === "unpaid" ? "Invoice" : "Payment received"}
            </p>
            <p className="mt-2 text-base font-medium text-[#6b6d70]">#{SAMPLE.invoiceNumber}</p>
          </div>

          <div className="border-t border-[#e6e7e8] px-6 py-7 sm:px-8">
            <div className="space-y-4 text-[15px] leading-6 text-[#141517]">
              {lines.map((line, index) => {
                const trimmed = line.trim();
                if (!trimmed) {
                  return <div key={`spacer-${index}`} className="h-2" />;
                }

                const buttonMatch = trimmed.match(/^\[(.+)\]$/);
                if (buttonMatch) {
                  return (
                    <div key={`cta-${index}`} className="py-2 text-center">
                      <span className="inline-block rounded-lg bg-[#d41920] px-7 py-3.5 text-[15px] font-semibold text-white">
                        {buttonMatch[1] || ctaLabel}
                      </span>
                    </div>
                  );
                }

                const emphasized = trimmed
                  .replaceAll(SAMPLE.invoiceNumber, `__B__${SAMPLE.invoiceNumber}__/B__`)
                  .replaceAll(SAMPLE.total, `__B__${SAMPLE.total}__/B__`);

                const parts = emphasized.split(/(__B__.*?__\/B__)/g);

                return (
                  <p key={`line-${index}`} className="whitespace-pre-wrap">
                    {parts.map((part, partIndex) => {
                      if (part.startsWith("__B__") && part.endsWith("__/B__")) {
                        return (
                          <strong key={partIndex} className="font-semibold">
                            {part.slice(5, -5)}
                          </strong>
                        );
                      }
                      return <span key={partIndex}>{part}</span>;
                    })}
                  </p>
                );
              })}
            </div>

            <div className="mt-8 border-t border-[#e6e7e8] pt-5">
              <p className="text-[12px] leading-5 text-[#6b6d70]">
                This is an automated email from {SAMPLE.companyName}. Please do not reply directly to
                this message.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplatesSettingsPage() {
  const { notify } = useToast();
  const [templates, setTemplates] = useState<EmailTemplateSettings | null>(null);
  const [selected, setSelected] = useState<TemplateKind>("unpaid");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [viewingCode, setViewingCode] = useState(false);
  const [draft, setDraft] = useState<EmailTemplatePair | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTemplates(await getEmailTemplates());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load email templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeTemplate = templates?.[selected] ?? null;
  const activeMeta = TEMPLATE_META[selected];

  const codeSource = useMemo(() => {
    if (!activeTemplate) {
      return "";
    }
    return formatSource(activeTemplate);
  }, [activeTemplate]);

  function openEdit() {
    if (!activeTemplate) {
      return;
    }
    setDraft({ ...activeTemplate });
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!templates || !draft) {
      return;
    }
    setSaving(true);
    try {
      const next = {
        ...templates,
        [selected]: {
          subject: draft.subject.trim(),
          body: draft.body.trim(),
        },
      };
      setTemplates(await saveEmailTemplates(next));
      setEditing(false);
      setDraft(null);
      notify("Template saved");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to save template.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codeSource);
      notify("Template code copied");
    } catch {
      notify("Unable to copy template code.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        description="Select a template to preview what customers will receive."
      />

      {loading ? (
        <p className="text-sm text-muted">Loading templates…</p>
      ) : error || !templates || !activeTemplate ? (
        <p className="text-sm text-red-700">{error ?? "Templates unavailable."}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-2xl border border-border bg-surface p-2">
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Mail templates
            </p>
            <div className="space-y-1">
              {TEMPLATE_ORDER.map((kind) => {
                const meta = TEMPLATE_META[kind];
                const isActive = selected === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setSelected(kind)}
                    className={cn(
                      "w-full rounded-xl px-3 py-3 text-left transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted-soft",
                    )}
                  >
                    <p className="text-sm font-semibold">{meta.name}</p>
                    <p
                      className={cn(
                        "mt-1 text-xs leading-5",
                        isActive ? "text-primary-foreground/80" : "text-muted",
                      )}
                    >
                      {meta.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">{activeMeta.name}</h2>
                <p className="mt-1 text-sm text-muted">{activeMeta.description}</p>
                <p className="mt-3 text-sm">
                  <span className="text-muted">Subject:</span>{" "}
                  <span className="font-medium text-foreground">
                    {fillPlaceholders(activeTemplate.subject)}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => setViewingCode(true)}>
                  View Code
                </Button>
                <Button type="button" onClick={openEdit}>
                  Edit Template
                </Button>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <EmailPreview
                kind={selected}
                subject={activeTemplate.subject}
                body={activeTemplate.body}
              />
            </div>
          </section>
        </div>
      )}

      {editing && draft ? (
        <Dialog
          title={`Edit ${activeMeta.name}`}
          wide
          onClose={() => {
            setEditing(false);
            setDraft(null);
          }}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  setDraft(null);
                }}
              >
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={() => void handleSaveEdit()}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          <p className="mb-4 text-sm text-muted">
            Use placeholders such as {"{{customerName}}"}, {"{{invoiceNumber}}"}, {"{{total}}"},{" "}
            {"{{dueDate}}"}, {"{{paymentDate}}"}, and {"{{companyName}}"}. Wrap call-to-action labels
            in brackets, for example [Pay Invoice].
          </p>
          <div className="space-y-4">
            <Field label="Subject" htmlFor="edit-subject">
              <TextInput
                id="edit-subject"
                value={draft.subject}
                onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
              />
            </Field>
            <Field label="Body" htmlFor="edit-body">
              <TextArea
                id="edit-body"
                rows={12}
                value={draft.body}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              />
            </Field>
          </div>
        </Dialog>
      ) : null}

      {viewingCode ? (
        <Dialog
          title={`${activeMeta.name} · Source`}
          wide
          onClose={() => setViewingCode(false)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setViewingCode(false)}>
                Close
              </Button>
              <Button type="button" onClick={() => void copyCode()}>
                Copy
              </Button>
            </>
          }
        >
          <p className="mb-3 text-sm text-muted">
            Raw template with placeholders. This is the only place placeholders are shown.
          </p>
          <pre className="overflow-x-auto rounded-xl border border-border bg-muted-soft/50 p-4 text-sm leading-6 text-foreground whitespace-pre-wrap">
            {codeSource}
          </pre>
        </Dialog>
      ) : null}
    </div>
  );
}
