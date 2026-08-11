import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDocumentTypes } from "@/lib/secretary-data";
import { DocumentTypesManager } from "../../_components/document-types-manager";

export const metadata: Metadata = {
  title: "Documents · Secretary · Barangay Libtangin",
};

export default async function SecretaryDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const types = await getDocumentTypes();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Document Catalog & Template Designer
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            Configure official barangay clearances, residency certificates, and permits available to residents. Customize fees, processing turnaround, and printed certificate templates.
          </p>
        </div>
        <Button asChild>
          <Link href={`/secretary/${id}/documents/new`}>
            <Plus />
            Add Document
          </Link>
        </Button>
      </header>

      <DocumentTypesManager
        types={types}
        basePath={`/secretary/${id}/documents`}
      />
    </div>
  );
}
