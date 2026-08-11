import type { Metadata } from "next";

import { getPaymentMethods } from "@/lib/treasurer-data";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import { PaymentMethodsManager } from "../../_components/payment-methods-manager";

export const metadata: Metadata = {
  title: "Payment Methods · Treasury · Barangay Libtangin",
};

export default async function TreasurerMethodsPage() {
  const methods = await getPaymentMethods();
  const uploadsEnabled = isCloudinaryConfigured();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Payment Channels & Configuration
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            Set up accepted resident payment channels, GCash QR codes, bank transfer details, or barangay hall cash desk instructions.
          </p>
        </div>
      </header>

      <PaymentMethodsManager methods={methods} uploadsEnabled={uploadsEnabled} />
    </div>
  );
}
