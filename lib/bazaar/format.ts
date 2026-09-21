export function formatProductId(id: string) {
  return id.replaceAll("_", " ");
}

export function formatCoins(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: value >= 100 ? 1 : 2,
  });
}

export function formatVolume(value: number) {
  return Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPct(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatTimestamp(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
