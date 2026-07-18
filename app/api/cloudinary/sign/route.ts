import { v2 as cloudinary } from "cloudinary";

import { auth } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Signs Cloudinary upload params for the resident ID-photo widget. The API
 * secret never leaves the server: the browser sends the params it wants to
 * upload with, we sign them here and hand back only the signature. Gated behind
 * a session so anonymous callers can't mint upload signatures.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) {
    return Response.json(
      { error: "Cloudinary is not configured." },
      { status: 500 },
    );
  }

  const { paramsToSign } = (await request.json()) as {
    paramsToSign: Record<string, string>;
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, secret);
  return Response.json({ signature });
}
