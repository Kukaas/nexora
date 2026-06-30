import type { Metadata } from "next";

import { DocumentTypeForm } from "../../../_components/document-type-form";

export const metadata: Metadata = {
  title: "Add document · Secretary · Barangay Libtangin",
};

export default async function NewDocumentTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <DocumentTypeForm
      editing={null}
      backHref={`/secretary/${id}/documents`}
    />
  );
}
