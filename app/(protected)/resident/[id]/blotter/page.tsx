import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getResidencyStatus } from "@/lib/profile";
import { getResidentBlotterRecords } from "@/lib/blotter-data";
import { ResidentBlotterList } from "../../_components/resident-blotter-list";

export const metadata: Metadata = {
  title: "Barangay Blotter Records · Resident Portal · Barangay Libtangin",
};

export default async function ResidentBlotterListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const [records, residency] = await Promise.all([
    getResidentBlotterRecords(id),
    getResidencyStatus(id),
  ]);

  return (
    <ResidentBlotterList
      records={records}
      residentId={id}
      verified={residency === "approved"}
      residencyStatus={residency}
    />
  );
}
