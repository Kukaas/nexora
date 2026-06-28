import type { Metadata } from "next";

import { getDocumentTypes } from "@/lib/secretary-data";
import { DocumentTypesManager } from "../../_components/document-types-manager";

export const metadata: Metadata = {
  title: "Documents · Secretary · Barangay Libtangin",
};

export default async function SecretaryDocumentsPage() {
  const types = await getDocumentTypes();

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Document catalog
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Set which documents residents can request and the fee for each. Turn a
          document off to stop new requests without losing its history.
        </p>
      </header>

      <div className="mt-8">
        <DocumentTypesManager types={types} />
      </div>
    </div>
  );
}
