import type { Metadata } from "next";

import { RoleDashboard } from "../_components/role-dashboard";

export const metadata: Metadata = {
  title: "Secretary · Barangay Libtangin",
};

export default function SecretaryPage() {
  return (
    <RoleDashboard
      title="Secretary dashboard"
      description="Process document requests, records, and certificates."
    />
  );
}
