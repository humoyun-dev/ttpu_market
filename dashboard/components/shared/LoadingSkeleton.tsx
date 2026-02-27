import { cn } from "@/lib/utils";

export function LoadingSkeleton({
  className,
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn("space-y-2", className)} aria-label="Loading">
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="h-4 w-full animate-pulse rounded-md bg-muted"
        />
      ))}
    </div>
  );
}

