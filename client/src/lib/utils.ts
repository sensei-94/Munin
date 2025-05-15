import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
}

export function formatNumberWithCommas(number: number | string): string {
  return Number(number).toLocaleString();
}

export function getExplorerUrl(txId: string, cluster = "devnet"): string {
  const clusterQuery = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${txId}${clusterQuery}`;
}

export function getTokenExplorerUrl(address: string, cluster = "devnet"): string {
  const clusterQuery = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
  return `https://explorer.solana.com/address/${address}${clusterQuery}`;
}
