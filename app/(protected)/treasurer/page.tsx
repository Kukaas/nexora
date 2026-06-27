import type { Metadata } from "next";

import { RoleDashboard } from "../_components/role-dashboard";

export const metadata: Metadata = {
  title: "Treasurer · Barangay Libtangin",
};

export default function TreasurerPage() {
  return (
    <RoleDashboard
      title="Treasurer dashboard"
      description="Track payments, fees, and financial records."
    />
  );
}
