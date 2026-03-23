import { createHmac, timingSafeEqual } from "crypto";

function getTokenSecret(): string {
  return process.env.PROPERTY_URL_SECRET || process.env.AUTH_JWT_SECRET || "dev-property-url-secret";
}

function buildSignature(rawId: string): string {
  return createHmac("sha256", getTokenSecret()).update(rawId).digest("base64url").slice(0, 16);
}

export function encodePropertyId(id: number): string {
  const rawId = String(id);
  return `${rawId}.${buildSignature(rawId)}`;
}

function normalizePropertyIdValue(value: string): string {
  return value.trim().replace(/[~,]/, ".");
}

export function decodePropertyId(value: string): number | null {
  const normalized = normalizePropertyIdValue(value);

  if (/^\d+$/.test(normalized)) {
    const direct = Number(normalized);
    return Number.isFinite(direct) ? direct : null;
  }

  const parts = normalized.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [rawId, signature] = parts;
  if (!rawId || !signature || !/^\d+$/.test(rawId)) {
    return null;
  }

  const expected = buildSignature(rawId);
  if (signature.length !== expected.length) {
    return null;
  }

  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    return null;
  }

  const parsed = Number(rawId);
  return Number.isFinite(parsed) ? parsed : null;
}

export function canonicalizePropertyId(value: string): string | null {
  const id = decodePropertyId(value);
  return id == null ? null : encodePropertyId(id);
}

export function isCanonicalPropertyId(value: string): boolean {
  const normalized = normalizePropertyIdValue(value);
  return normalized === canonicalizePropertyId(normalized);
}
