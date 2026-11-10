export function money(value: number, digits = 2): string {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function ratio(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function yearsLabel(value: number | null, digits = 4): string {
  return value == null ? "期内未回收" : `${value.toFixed(digits)} 年`;
}

export function irrLabel(value: number | null): string {
  return value == null ? "不存在" : ratio(value, 6);
}

export function isBlankNumber(raw: string): boolean {
  const text = raw.trim();
  return text !== "" && !Number.isFinite(Number(text));
}
