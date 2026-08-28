import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatCurrency(v:number,currency="INR"){ return new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:0}).format(v); }
export function formatDate(d:Date|string){ return new Date(d).toLocaleDateString("en-IN",{year:"numeric",month:"short",day:"numeric"}); }
export function formatDateTime(d:Date|string){ return new Date(d).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}); }
