import crypto from "node:crypto";

export function createTrackingToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashTrackingToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
