import type { ProposalStatus } from "@/types/api";
import { cn, getStatusColor } from "@/lib/utils";

export default function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        getStatusColor(status)
      )}
    >
      {status}
    </span>
  );
}
