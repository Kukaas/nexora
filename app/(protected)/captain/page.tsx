import type { Metadata } from "next";

import { RoleDashboard } from "../_components/role-dashboard";

export const metadata: Metadata = {
  title: "Captain · Barangay Libtangin",
};

export default function CaptainPage() {
  return (
    <RoleDashboard
      title="Captain dashboard"
      description="Oversee barangay operations, approvals, and reports."
    />
  );
}
