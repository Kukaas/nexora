import { cn } from "@/lib/utils";
import { UserRoles } from "@/app/generated/prisma/enums";
import { ROLE_META } from "../_data";

/**
 * A role label with its icon. Roles are categorical, not stateful, so these stay
 * neutral; the admin's eye is drawn to amber actions and colored status badges,
 * not to the role column.
 */
export function RoleBadge({
  role,
  className,
}: {
  role: UserRoles;
  className?: string;
}) {
  const { label, icon: Icon } = ROLE_META[role];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground",
        className,
      )}
    >
      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      {label}
    </span>
  );
}
