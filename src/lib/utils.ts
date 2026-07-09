import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    housing: "#ef4444",
    food: "#f97316",
    transportation: "#eab308",
    utilities: "#22c55e",
    entertainment: "#3b82f6",
    shopping: "#8b5cf6",
    health: "#ec4899",
    education: "#06b6d4",
    savings: "#10b981",
    income: "#14b8a6",
  };

  return colors[category.toLowerCase()] ?? "#6b7280";
}
