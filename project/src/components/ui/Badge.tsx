import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  className?: string;
  children: ReactNode;
}

export function Badge({ className, children }: BadgeProps) {
  return <span className={cn("badge", className)}>{children}</span>;
}
