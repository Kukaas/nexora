import type { Metadata } from "next";

import { RoleDashboard } from "../_components/role-dashboard";

export const metadata: Metadata = {
  title: "Kagawad · Barangay Libtangin",
};

export default function KagawadPage() {
  return (
    <RoleDashboard
      title="Kagawad dashboard"
      description="Review complaints, assist residents, and support council work."
    />
  );
}
