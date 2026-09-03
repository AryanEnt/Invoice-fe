import { apiRequest } from "@/lib/api/client";

export async function createExpense(input: {
  organizationId?: string;
  categoryName: string;
  amount: string;
  incurredOn: string;
  vendor?: string;
  notes?: string;
}): Promise<void> {
  await apiRequest<{ expense: { id: string } }>("/api/expenses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
