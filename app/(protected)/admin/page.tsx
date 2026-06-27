import type { Metadata } from "next";

import { RoleDashboard } from "../_components/role-dashboard";

export const metadata: Metadata = {
  title: "Admin · Barangay Libtangin",
};

export default function AdminPage() {
  return (
    <RoleDashboard
      title="Admin console"
      description="Full access. Create and manage official accounts and barangay settings."
    />
  );
}
