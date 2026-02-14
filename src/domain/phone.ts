// Accepts the ways people usually type an Indian mobile number and returns +91XXXXXXXXXX.
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/[\s\-.()]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}
