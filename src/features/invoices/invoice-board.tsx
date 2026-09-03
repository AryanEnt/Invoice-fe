"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ApiError } from "@/lib/api/types";
import { listInvoices } from "@/services/invoices.service";
import type { Invoice, InvoiceStatus } from "@/types/invoice";
import { InvoiceBoardCard, InvoiceBoardCardSkeleton } from "@/features/invoices/invoice-board-card";

export type InvoiceBoardColumnId = "new" | "sent" | "overdue" | "paid";

const COLUMNS: Array<{
  id: InvoiceBoardColumnId;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  listStatus: InvoiceStatus | "";
}> = [
  {
    id: "new",
    title: "New",
    emptyTitle: "No new invoices",
    emptyDescription: "Draft invoices will show up here.",
    listStatus: "DRAFT",
  },
  {
    id: "sent",
    title: "Sent",
    emptyTitle: "No sent invoices",
    emptyDescription: "Awaiting payment invoices will appear here.",
    listStatus: "SENT",
  },
  {
    id: "overdue",
    title: "Overdue",
    emptyTitle: "No overdue invoices",
    emptyDescription: "You're all caught up.",
    listStatus: "OVERDUE",
  },
  {
    id: "paid",
    title: "Paid",
    emptyTitle: "No paid invoices",
    emptyDescription: "Paid invoices for this period will show here.",
    listStatus: "PAID",
  },
];

const BOARD_PAGE_SIZE = 5;

interface ColumnState {
  items: Invoice[];
  total: number;
  loading: boolean;
  error: string | null;
}

type BoardState = Record<InvoiceBoardColumnId, ColumnState>;

function emptyBoardState(loading = true): BoardState {
  return {
    new: { items: [], total: 0, loading, error: null },
    sent: { items: [], total: 0, loading, error: null },
    overdue: { items: [], total: 0, loading, error: null },
    paid: { items: [], total: 0, loading, error: null },
  };
}

export function InvoiceBoard({
  search,
  dateFrom,
  dateTo,
  organizationId,
  administratorId,
  assignedMemberId,
  showMember,
  enabled,
  onViewAll,
}: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  organizationId?: string;
  administratorId?: string;
  assignedMemberId?: string;
  showMember: boolean;
  enabled: boolean;
  onViewAll: (column: InvoiceBoardColumnId, listStatus: InvoiceStatus | "") => void;
}) {
  const requestIdRef = useRef(0);
  const [board, setBoard] = useState<BoardState>(() => emptyBoardState(true));

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }
    const requestId = ++requestIdRef.current;
    setBoard(emptyBoardState(true));

    const results = await Promise.all(
      COLUMNS.map(async (column) => {
        try {
          const result = await listInvoices({
            search: search || undefined,
            boardColumn: column.id,
            organizationId: organizationId || undefined,
            administratorId: administratorId || undefined,
            assignedMemberId: assignedMemberId || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            sort: column.id === "overdue" ? "dueDate" : "createdAt",
            sortDir: column.id === "overdue" ? "asc" : "desc",
            page: 1,
            pageSize: BOARD_PAGE_SIZE,
          });
          return {
            id: column.id,
            state: {
              items: result.items,
              total: result.total,
              loading: false,
              error: null,
            } satisfies ColumnState,
          };
        } catch (err) {
          return {
            id: column.id,
            state: {
              items: [],
              total: 0,
              loading: false,
              error: err instanceof ApiError ? err.message : "Unable to load column.",
            } satisfies ColumnState,
          };
        }
      }),
    );

    if (requestId !== requestIdRef.current) {
      return;
    }

    setBoard((current) => {
      const next = { ...current };
      for (const result of results) {
        next[result.id] = result.state;
      }
      return next;
    });
  }, [
    administratorId,
    assignedMemberId,
    dateFrom,
    dateTo,
    enabled,
    organizationId,
    search,
  ]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) {
        void load();
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[64rem] gap-4">
        {COLUMNS.map((column) => {
          const state = board[column.id];
          return (
            <section
              key={column.id}
              className="flex w-72 shrink-0 flex-col rounded-2xl border border-border bg-muted-soft/40"
            >
              <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {column.title}{" "}
                  <span className="font-medium text-muted">({state.loading ? "…" : state.total})</span>
                </h3>
              </header>

              <div className="flex flex-1 flex-col gap-3 p-3">
                {state.loading ? (
                  <>
                    <InvoiceBoardCardSkeleton />
                    <InvoiceBoardCardSkeleton />
                    <InvoiceBoardCardSkeleton />
                  </>
                ) : state.error ? (
                  <ErrorState
                    title="Couldn't load"
                    message={state.error}
                    onRetry={() => void load()}
                  />
                ) : state.items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center">
                    <p className="text-sm font-medium text-foreground">{column.emptyTitle}</p>
                    <p className="mt-1 text-xs text-muted">{column.emptyDescription}</p>
                  </div>
                ) : (
                  state.items.map((invoice) => (
                    <InvoiceBoardCard
                      key={invoice.id}
                      invoice={invoice}
                      showMember={showMember}
                    />
                  ))
                )}
              </div>

              {!state.loading && !state.error && state.total > BOARD_PAGE_SIZE ? (
                <div className="border-t border-border px-3 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-center text-sm"
                    onClick={() => onViewAll(column.id, column.listStatus)}
                  >
                    View all →
                  </Button>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
