import { describe, it, expect } from "vitest";
import { cn, formatSymptomName } from "./utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("should handle conditional classes", () => {
    const isHidden = false;
    expect(cn("base", isHidden && "hidden", "visible")).toBe("base visible");
  });

  it("should resolve conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("should handle arrays and objects", () => {
    expect(cn(["px-2", "py-1"], { "bg-red-500": true, "bg-blue-500": false })).toBe("px-2 py-1 bg-red-500");
  });

  it("should handle undefined and null values", () => {
    expect(cn("base", undefined, null, "extra")).toBe("base extra");
  });

  it("should handle empty input", () => {
    expect(cn()).toBe("");
  });
});

describe("formatSymptomName utility function", () => {
  it("should convert snake_case to Title Case", () => {
    // Arrange: Input with snake_case
    const input = "stomach_pain";
    const expected = "Stomach Pain";

    // Act: Execute the function
    const result = formatSymptomName(input);

    // Assert: Verify conversion
    expect(result).toBe(expected);
  });

  it("should handle single word", () => {
    expect(formatSymptomName("nausea")).toBe("Nausea");
  });

  it("should handle multiple underscores", () => {
    expect(formatSymptomName("severe_stomach_pain")).toBe("Severe Stomach Pain");
  });

  it("should handle uppercase input", () => {
    expect(formatSymptomName("STOMACH_PAIN")).toBe("Stomach Pain");
  });

  it("should handle mixed case input", () => {
    expect(formatSymptomName("StOmAcH_pAiN")).toBe("Stomach Pain");
  });

  it("should handle empty string", () => {
    // Arrange: Empty string input
    const input = "";
    const expected = "";

    // Act: Execute the function
    const result = formatSymptomName(input);

    // Assert: Verify empty string handling
    expect(result).toBe(expected);
  });

  it("should handle single character", () => {
    // Arrange: Single character input
    const input = "a";
    const expected = "A";

    // Act: Execute the function
    const result = formatSymptomName(input);

    // Assert: Verify single character capitalization
    expect(result).toBe(expected);
  });

  it("should handle leading/trailing underscores", () => {
    expect(formatSymptomName("_stomach_pain_")).toBe(" Stomach Pain ");
  });

  it("should handle consecutive underscores", () => {
    expect(formatSymptomName("stomach__pain")).toBe("Stomach  Pain");
  });
});
