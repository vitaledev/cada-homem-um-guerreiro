import {
  pbkdf2Sync,
  scryptSync,
  timingSafeEqual,
  randomBytes,
} from "node:crypto";
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64, { N: 65536, r: 8, p: 2, maxmem: 128 * 1024 * 1024 }).toString("hex")}`;
}
export function verifyPassword(password: string, encoded: string) {
  try {
    const [kind, a, b, c] = encoded.split("$");
    if (kind === "pbkdf2_sha256") {
      const iterations = Number(a);
      if (
        !Number.isInteger(iterations) ||
        iterations < 1000 ||
        iterations > 10000000
      )
        return false;
      const expected = Buffer.from(c, "base64");
      const actual = pbkdf2Sync(password, b, iterations, 32, "sha256");
      return (
        expected.length === actual.length && timingSafeEqual(actual, expected)
      );
    }
    if (kind === "scrypt") {
      const expected = Buffer.from(b, "hex");
      const actual = scryptSync(password, a, 64, {
        N: 65536,
        r: 8,
        p: 2,
        maxmem: 128 * 1024 * 1024,
      });
      return (
        expected.length === actual.length && timingSafeEqual(actual, expected)
      );
    }
    return false;
  } catch {
    return false;
  }
}
