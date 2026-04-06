export function statusUrl(token: string): string {
  const base = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/q/${token}`;
}
