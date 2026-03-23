import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  canonicalizePropertyId,
  decodePropertyId,
  encodePropertyId,
  isCanonicalPropertyId,
} from "@/lib/property-id-token";

describe("property-id-token", () => {
  const originalSecret = process.env.PROPERTY_URL_SECRET;
  const originalJwtSecret = process.env.AUTH_JWT_SECRET;

  beforeEach(() => {
    process.env.PROPERTY_URL_SECRET = "unit-test-property-secret";
    process.env.AUTH_JWT_SECRET = "unit-test-jwt-secret-123456";
  });

  afterAll(() => {
    process.env.PROPERTY_URL_SECRET = originalSecret;
    process.env.AUTH_JWT_SECRET = originalJwtSecret;
  });

  it("encodes and decodes a canonical token", () => {
    const token = encodePropertyId(42);

    expect(token).toMatch(/^42\.[A-Za-z0-9_-]{16}$/);
    expect(decodePropertyId(token)).toBe(42);
    expect(isCanonicalPropertyId(token)).toBe(true);
  });

  it("accepts direct numeric value", () => {
    expect(decodePropertyId("123")).toBe(123);
  });

  it("rejects tampered signature", () => {
    const token = encodePropertyId(99);
    const tampered = `${token.slice(0, -1)}X`;

    expect(decodePropertyId(tampered)).toBeNull();
  });

  it("normalizes legacy separator and canonicalizes it", () => {
    const token = encodePropertyId(777);
    const legacy = token.replace(".", "~");

    expect(decodePropertyId(legacy)).toBe(777);
    expect(canonicalizePropertyId(legacy)).toBe(token);
    expect(isCanonicalPropertyId(legacy)).toBe(true);
  });

  it("returns null for invalid formats", () => {
    expect(decodePropertyId("abc.def")).toBeNull();
    expect(decodePropertyId("12.abc.def")).toBeNull();
    expect(canonicalizePropertyId("bad-input")).toBeNull();
  });
});
