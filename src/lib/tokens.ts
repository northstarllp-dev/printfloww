import crypto from "node:crypto";

export function createTrackingToken() {
  const prefix = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
  const token = crypto.randomBytes(32).toString("base64url");
  return { prefix, token: `${prefix}-${token}` };
}

export function hashTrackingToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
