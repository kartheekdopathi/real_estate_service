import { describe, expect, it } from "vitest";

import { haversineDistanceKm, toRadians } from "@/lib/geo";

describe("geo library", () => {
  it("converts degrees to radians", () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI, 8);
    expect(toRadians(0)).toBe(0);
  });

  it("returns 0 distance for same coordinates", () => {
    const distance = haversineDistanceKm(12.9716, 77.5946, 12.9716, 77.5946);
    expect(distance).toBeCloseTo(0, 8);
  });

  it("returns approximate distance between Bengaluru and Chennai", () => {
    const distance = haversineDistanceKm(12.9716, 77.5946, 13.0827, 80.2707);
    expect(distance).toBeGreaterThan(280);
    expect(distance).toBeLessThan(320);
  });
});
