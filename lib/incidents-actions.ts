"use server";

import { getSession } from "@/lib/session";
import { uploadAttachment } from "@/lib/cloudinary";
import {
  createResidentIncident as createResidentIncidentData,
  updateIncidentStatus as updateIncidentStatusData,
  updateResidentIncident as updateResidentIncidentData,
  type CreateIncidentInput,
  type IncidentStatus,
} from "./incidents-data";

export async function createResidentIncident(input: CreateIncidentInput) {
  return createResidentIncidentData(input);
}

export async function updateResidentIncident(
  incidentId: string,
  input: {
    title?: string;
    category?: string;
    incidentDate?: string;
    location?: string;
    description?: string;
    attachmentUrl?: string | null;
    reporterContact?: string | null;
  }
) {
  return updateResidentIncidentData(incidentId, input);
}

export async function updateIncidentStatus(
  incidentId: string,
  input: { status?: IncidentStatus; adminNotes?: string }
) {
  return updateIncidentStatusData(incidentId, input);
}

export type UploadIncidentAttachmentResult =
  | { ok: true; url: string; name: string; size: number }
  | { ok: false; error: string };

export async function uploadIncidentAttachment(
  formData: FormData
): Promise<UploadIncidentAttachmentResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session expired. Sign in again." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }
  const MAX_BYTES = 15 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Keep attachments under 15 MB." };
  }

  try {
    const { url } = await uploadAttachment(file, "nexora/incident_proofs");
    return { ok: true, url, name: file.name, size: file.size };
  } catch (error) {
    console.error("uploadIncidentAttachment failed", error);
    return { ok: false, error: "The file couldn't be uploaded. Try again." };
  }
}
