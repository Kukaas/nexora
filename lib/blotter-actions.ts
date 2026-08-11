"use server";

import { getSession } from "@/lib/session";
import { uploadAttachment } from "@/lib/cloudinary";
import {
  createBlotterRecord as createBlotterRecordData,
  updateBlotterRecord as updateBlotterRecordData,
  createResidentBlotterRecord as createResidentBlotterRecordData,
  updateResidentBlotterRecord as updateResidentBlotterRecordData,
  type CreateBlotterInput,
  type UpdateBlotterInput,
  type IncidentType,
} from "./blotter-data";

export async function createBlotterRecord(input: CreateBlotterInput) {
  return createBlotterRecordData(input);
}

export async function updateBlotterRecord(blotterId: string, input: UpdateBlotterInput) {
  return updateBlotterRecordData(blotterId, input);
}

export async function createResidentBlotterRecord(input: {
  incidentType: IncidentType;
  incidentDate: string;
  incidentLocation: string;
  respondentName: string;
  respondentAddress?: string;
  narrative: string;
  complainantContact?: string;
  isConfidential?: boolean;
  attachmentUrl?: string;
}) {
  return createResidentBlotterRecordData(input);
}

export async function updateResidentBlotterRecord(
  blotterId: string,
  input: {
    incidentType?: IncidentType;
    incidentDate?: string;
    incidentLocation?: string;
    respondentName?: string;
    respondentAddress?: string | null;
    narrative?: string;
    complainantContact?: string | null;
    isConfidential?: boolean;
    attachmentUrl?: string | null;
  }
) {
  return updateResidentBlotterRecordData(blotterId, input);
}

export type UploadProofResult =
  | { ok: true; url: string; name: string; size: number }
  | { ok: false; error: string };

export async function uploadBlotterProofAttachment(
  formData: FormData
): Promise<UploadProofResult> {
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
    const { url } = await uploadAttachment(file, "nexora/blotter_proofs");
    return { ok: true, url, name: file.name, size: file.size };
  } catch (error) {
    console.error("uploadBlotterProofAttachment failed", error);
    return { ok: false, error: "The file couldn't be uploaded. Try again." };
  }
}
