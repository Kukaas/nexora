import type { Metadata } from "next";

import { RoleDashboard } from "../_components/role-dashboard";

export const metadata: Metadata = {
  title: "Resident · Barangay Libtangin",
};

export default function ResidentPage() {
  return (
    <RoleDashboard
      title="Resident dashboard"
      description="Request documents, track your requests, and manage your profile."
    />
  );
}
