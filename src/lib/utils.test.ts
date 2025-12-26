import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("should resolve conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("should handle arrays and objects", () => {
    expect(cn(["px-2", "py-1"], { "bg-red-500": true, "bg-blue-500": false })).toBe(
      "px-2 py-1 bg-red-500"
    );
  });

  it("should handle undefined and null values", () => {
    expect(cn("base", undefined, null, "extra")).toBe("base extra");
  });

  it("should handle empty input", () => {
    expect(cn()).toBe("");
  });
});