"use client";

import { Button } from "@/components/ui/button";
import { announceComingSoon } from "./coming-soon";

type Props = React.ComponentProps<typeof Button> & {
  /** The feature name used in the toast, e.g. "Document requests". */
  feature: string;
};

export function ComingSoonButton({ feature, children, ...props }: Props) {
  return (
    <Button {...props} onClick={() => announceComingSoon(feature)}>
      {children}
    </Button>
  );
}
