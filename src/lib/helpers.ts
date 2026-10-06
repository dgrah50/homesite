// Short list-style date, e.g. "feb '24". UTC so it matches frontmatter dates.
export function formatDate(date: Date): string {
  const month = date
    .toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
    .toLowerCase();
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${month} '${year}`;
}
