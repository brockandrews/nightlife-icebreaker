import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generates an unambiguous 4-character uppercase alphanumeric code (omitting 0, O, 1, I, L)
export function generateShortCode(): string {
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  return code;
}

// Generates a canonical pair key for two player IDs to guarantee uniqueness
export function generatePairKey(playerAId: string, playerBId: string): string {
  return playerAId < playerBId
    ? `${playerAId}:${playerBId}`
    : `${playerBId}:${playerAId}`;
}

// Shuffles an array randomly (Fisher-Yates)
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Format seconds into MM:SS
export function formatSecondsToTime(seconds: number): string {
  if (seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
