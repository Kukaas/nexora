import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDocumentTypeById, getMediaAssets } from "@/lib/secretary-data";
import { DocumentDesigner } from "../../../../_components/document-designer";

export const metadata: Metadata = {
  title: "Design document · Secretary · Barangay Libtangin",
};

export default async function DesignDocumentPage({
  params,
}: {
  params: Promise<{ id: string; typeId: string }>;
}) {
  const { id, typeId } = await params;
  const [type, mediaAssets] = await Promise.all([
    getDocumentTypeById(typeId),
    getMediaAssets(),
  ]);
  if (!type) notFound();

  return (
    <DocumentDesigner
      documentType={type}
      mediaAssets={mediaAssets}
      backHref={`/secretary/${id}/documents`}
    />
  );
}
