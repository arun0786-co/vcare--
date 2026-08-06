import { randomBytes, scrypt as scryptCallback, type ScryptOptions } from "node:crypto";

const KEY_LENGTH = 64;
const OPTIONS: ScryptOptions = { N: 16384, r: 8, p: 1 };

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCallback(password, salt, KEY_LENGTH, OPTIONS, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

// Stored as "scrypt$<salt>$<hash>", both base64.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}
