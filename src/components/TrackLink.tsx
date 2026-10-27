"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = ComponentProps<typeof Link> & {
  event: string;
  eventProps?: Record<string, string | number | boolean | null | undefined>;
};

/** Next Link that fires a PostHog event on click. */
export function TrackLink({ event, eventProps, onClick, ...rest }: Props) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        trackEvent(event, eventProps);
        onClick?.(e);
      }}
    />
  );
}
