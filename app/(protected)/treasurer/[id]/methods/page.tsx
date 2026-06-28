import type { Metadata } from "next";

import { getPaymentMethods } from "@/lib/treasurer-data";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { PaymentMethodsManager } from "../../_components/payment-methods-manager";

export const metadata: Metadata = {
  title: "Payment methods · Treasury · Barangay Libtangin",
};

export default async function TreasurerMethodsPage() {
  const methods = await getPaymentMethods();
  const uploadsEnabled = isCloudinaryConfigured();

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Payment methods</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Set up how residents pay. Upload your GCash and Maya QR codes, or accept
          cash at the hall. Only the channels you turn on are shown to residents.
        </p>
      </header>

      <div className="mt-8">
        <PaymentMethodsManager methods={methods} uploadsEnabled={uploadsEnabled} />
      </div>
    </div>
  );
}
