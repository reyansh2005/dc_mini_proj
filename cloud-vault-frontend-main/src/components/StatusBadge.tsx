import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "online" | "offline" | "active" | "inactive";
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const isOnline = status === "online" || status === "active";
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        isOnline 
          ? "bg-success/20 text-success border border-success/30" 
          : "bg-destructive/20 text-destructive border border-destructive/30",
        className
      )}
    >
      <div 
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isOnline ? "bg-success" : "bg-destructive"
        )}
      />
      {isOnline ? "Online" : "Offline"}
    </span>
  );
};