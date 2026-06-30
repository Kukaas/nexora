import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDocumentTypeById } from "@/lib/secretary-data";
import { DocumentTypeForm } from "../../../../_components/document-type-form";

export const metadata: Metadata = {
  title: "Edit document · Secretary · Barangay Libtangin",
};

export default async function EditDocumentTypePage({
  params,
}: {
  params: Promise<{ id: string; typeId: string }>;
}) {
  const { id, typeId } = await params;
  const type = await getDocumentTypeById(typeId);
  if (!type) notFound();

  return (
    <DocumentTypeForm
      editing={type}
      backHref={`/secretary/${id}/documents`}
    />
  );
}
