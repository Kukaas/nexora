import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { getResidencyStatus } from "@/lib/profile";
import {
  getDocumentTypeById,
  getEnabledPaymentMethods,
  getMyDocumentRequestById,
} from "@/lib/documents-data";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import type { DocumentTypeDTO } from "@/lib/documents";
import {
  RequestForm,
  type RequestEditContext,
} from "../../../../_components/request-form";

export const metadata: Metadata = {
  title: "Edit request · Barangay Libtangin",
};

export default async function ResidentRequestEditPage({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const residency = await getResidencyStatus(session.user.id);
  if (residency !== "approved") redirect(`/resident/${id}`);

  const request = await getMyDocumentRequestById(session.user.id, requestId);
  if (!request) notFound();

  const detailHref = `/resident/${id}/requests/${request.id}`;

  // Only pending or rejected requests are editable; anything further along is
  // already being prepared, so send the resident to the read-only detail view.
  const editable =
    request.status === DocumentRequestStatus.PENDING ||
    request.status === DocumentRequestStatus.REJECTED;
  if (!editable) redirect(detailHref);

  // Render the form against the document's current fields, but keep the fee and
  // name snapshotted on the request so a later price change never applies here.
  const liveType = request.documentTypeId
    ? await getDocumentTypeById(request.documentTypeId)
    : null;

  const type: DocumentTypeDTO = liveType
    ? { ...liveType, name: request.documentName, fee: request.fee }
    : {
        id: request.documentTypeId ?? "",
        name: request.documentName,
        description: null,
        fee: request.fee,
        turnaroundDays: 0,
        active: false,
        fields: [],
        requestCount: 0,
        updatedAt: null,
      };

  // Prefill each current field from the request's saved answers, matched by
  // label (the snapshot's stable key).
  const byLabel = new Map(request.fieldValues.map((v) => [v.label, v.value]));
  const answers: Record<string, string> = {};
  for (const field of type.fields) {
    answers[field.id] = byLabel.get(field.label) ?? "";
  }

  const methods = await getEnabledPaymentMethods();
  const uploadsEnabled = isCloudinaryConfigured();

  const editing: RequestEditContext = {
    requestId: request.id,
    purpose: request.purpose ?? "",
    answers,
    method: request.method,
    paymentReference: request.paymentReference ?? "",
    existingProof: request.proofImage,
    note: request.note,
    wasRejected: request.status === DocumentRequestStatus.REJECTED,
    resubmitNote: request.resubmitNote ?? "",
  };

  return (
    <RequestForm
      type={type}
      methods={methods}
      uploadsEnabled={uploadsEnabled}
      backHref={detailHref}
      editing={editing}
    />
  );
}
