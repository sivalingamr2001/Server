import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface StatusConfig {
  label: string;
  className: string;
}

export const STATUS_MAP: Record<number, StatusConfig> = {
  1: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
  },
  2: {
    label: "Approved",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
  },
  3: {
    label: "Denied",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
  },
};

export const ACCESS_TYPE_MAP: Record<number, StatusConfig> = {
  1: {
    label: "Not Applicable",
    className: "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-red-400 border-destructive/20"
  },
  2: {
    label: "Read Only",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
  },
  3: {
    label: "Read and Write",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
  },
};

export const DEFAULT_STATUS: StatusConfig = {
  label: "Unknown",
  className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
};


export const getAccessTypeLabel = (accessType: number): string => {
  const statuses: Record<number, string> = {
    1: 'Not Applicable',
    2: 'Read Only',
    3: 'Read and Write',
  };
  return statuses[accessType] || 'Unknown';
};
