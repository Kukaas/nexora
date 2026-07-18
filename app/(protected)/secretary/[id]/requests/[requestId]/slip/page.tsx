import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDocumentRequestById } from "@/lib/secretary-data";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import { PaymentSlipView } from "../../../../_components/payment-slip-view";

export const metadata: Metadata = {
  title: "Payment slip · Secretary · Barangay Libtangin",
};

export default async function PaymentSlipPage({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  const request = await getDocumentRequestById(requestId);
  if (!request) notFound();

  // A slip only matters while the payment is still owed; once the treasurer
  // has verified (or rejected) the request there's nothing to hand over.
  if (request.status !== DocumentRequestStatus.PENDING) notFound();

  return (
    <PaymentSlipView
      request={request}
      backHref={`/secretary/${id}/requests/${requestId}`}
    />
  );
}
