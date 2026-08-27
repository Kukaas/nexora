import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { getResidencyStatus, getResidentProfile } from "@/lib/profile";
import {
  getActiveDocumentTypeById,
  getEnabledPaymentMethods,
} from "@/lib/documents-data";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { PUROK_LABELS } from "@/lib/purok";
import {
  RequestForm,
  buildProfileInfo,
  type ProfileInfo,
} from "../../../_components/request-form";

export const metadata: Metadata = {
  title: "Request a document · Barangay Libtangin",
};

export default async function ResidentRequestPage({
  params,
}: {
  params: Promise<{ id: string; typeId: string }>;
}) {
  const { id, typeId } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  // The request flow acts on the signed-in resident's behalf, so a mismatched
  // id in the URL is sent back to their own request page rather than someone
  // else's.
  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  // Residents can only transact once an official has approved their ID. An
  // unverified resident who reaches this URL directly is bounced to the portal.
  const residency = await getResidencyStatus(session.user.id);
  if (residency !== "approved") redirect(`/resident/${id}`);

  const [type, methods, profile] = await Promise.all([
    getActiveDocumentTypeById(typeId),
    getEnabledPaymentMethods(),
    getResidentProfile(session.user.id),
  ]);
  if (!type) notFound();

  const uploadsEnabled = isCloudinaryConfigured();

  // Build profile summary for dynamic field pre-filling
  const profileInfo: ProfileInfo | undefined = buildProfileInfo(profile);

  return (
    <RequestForm
      type={type}
      methods={methods}
      uploadsEnabled={uploadsEnabled}
      backHref={`/resident/${id}`}
      profileInfo={profileInfo}
    />
  );
}
