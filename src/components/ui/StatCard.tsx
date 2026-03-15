import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trendUp ? "text-emerald-400" : "text-red-400"
              )}
            >
              {trend}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-white/10 p-2.5">
          <Icon className="h-5 w-5 text-violet-400" />
        </div>
      </div>
    </div>
  );
}
