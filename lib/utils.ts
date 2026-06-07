import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt: string = "yyyy-MM-dd"): string {
  const d = typeof date === "string" ? parseLocalDate(date) : date;
  const map: Record<string, string> = {
    yyyy: d.getFullYear().toString(),
    MM: String(d.getMonth() + 1).padStart(2, "0"),
    dd: String(d.getDate()).padStart(2, "0"),
    HH: String(d.getHours()).padStart(2, "0"),
    mm: String(d.getMinutes()).padStart(2, "0"),
  };
  let result = fmt;
  for (const [key, val] of Object.entries(map)) {
    result = result.replace(key, val);
  }
  return result;
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getWeekDays(date: Date = new Date()): string[] {
  const now = new Date(date);
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(formatDate(d, "yyyy-MM-dd"));
  }
  return days;
}

export function getChineseWeekday(dateStr: string): string {
  const map: Record<number, string> = {
    0: "日", 1: "一", 2: "二", 3: "三",
    4: "四", 5: "五", 6: "六",
  };
  return `周${map[parseLocalDate(dateStr).getDay()]}`;
}

export function getWeekRange(date: Date = new Date()): { start: string; end: string } {
  const days = getWeekDays(date);
  return { start: days[0], end: days[6] };
}

export function calculateProgress(tasks: { completed: boolean }[]): number {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
}

export function getCurrentTaskIndex(tasks: { time: string; endTime?: string }[]): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return tasks.findIndex((t) => {
    const [h, m] = t.time.split(":").map(Number);
    const startMins = h * 60 + m;
    if (t.endTime) {
      const [eh, em] = t.endTime.split(":").map(Number);
      return currentMinutes >= startMins && currentMinutes < eh * 60 + em;
    }
    return Math.abs(currentMinutes - startMins) <= 30;
  });
}
