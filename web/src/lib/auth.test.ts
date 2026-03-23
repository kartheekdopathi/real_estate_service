import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { hashPassword, signAuthToken, verifyAuthToken, verifyPassword } from "@/lib/auth";

describe("auth library", () => {
  const originalSecret = process.env.AUTH_JWT_SECRET;

  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = "my-super-secret-for-tests-123456";
  });

  afterAll(() => {
    process.env.AUTH_JWT_SECRET = originalSecret;
  });

  it("hashes and verifies password", async () => {
    const hash = await hashPassword("MyPass#123");

    expect(hash).not.toBe("MyPass#123");
    await expect(verifyPassword("MyPass#123", hash)).resolves.toBe(true);
    await expect(verifyPassword("WrongPass", hash)).resolves.toBe(false);
  });

  it("signs and verifies auth token", async () => {
    const token = await signAuthToken({ userId: 10, role: "ADMIN" });

    expect(typeof token).toBe("string");
    await expect(verifyAuthToken(token)).resolves.toEqual({ userId: 10, role: "ADMIN" });
  });

  it("returns null for invalid token", async () => {
    await expect(verifyAuthToken("not.a.valid.token")).resolves.toBeNull();
  });

  it("fails to sign token when secret is missing", async () => {
    delete process.env.AUTH_JWT_SECRET;

    await expect(signAuthToken({ userId: 1, role: "BUYER" })).rejects.toThrow(
      "AUTH_JWT_SECRET is not configured",
    );
  });
});
