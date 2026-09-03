import { InvoiceEditorPage } from "@/features/invoices/invoice-editor-page";

export default async function EditInvoiceRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvoiceEditorPage invoiceId={id} />;
}
