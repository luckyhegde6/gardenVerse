import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export function formatDate(
  date: string | Date,
  format = "MMM D, YYYY",
): string {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format("MMM D, YYYY h:mm A");
}

export function formatRelativeTime(date: string | Date): string {
  return dayjs(date).fromNow();
}

export function formatTime(date: string | Date): string {
  return dayjs(date).format("h:mm A");
}

export function formatNumber(num: number, decimals = 0): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(decimals);
}

export function formatCurrency(amount: number, currency = "GVC"): string {
  return `${amount.toLocaleString()} ${currency}`;
}

export function formatPercentage(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatGrowthStage(stage: number): string {
  if (stage <= 0) return "Seed";
  if (stage <= 25) return "Sprouting";
  if (stage <= 50) return "Growing";
  if (stage <= 75) return "Maturing";
  if (stage <= 99) return "Mature";
  return "Ready to Harvest";
}

export function formatHealthScore(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Needs Attention";
  if (score >= 20) return "Unhealthy";
  return "Critical";
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
