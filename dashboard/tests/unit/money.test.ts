import { describe, expect, it } from "vitest";

import {
  minorUnitsToDecimalString,
  parseDecimalToMinorUnits,
} from "@/lib/utils/money";

describe("money utils", () => {
  it("parses decimals to minor units without float math", () => {
    expect(parseDecimalToMinorUnits("0.1", { decimals: 2 })).toBe("10");
    expect(parseDecimalToMinorUnits("110000", { decimals: 2 })).toBe("11000000");
    expect(parseDecimalToMinorUnits("110000.01", { decimals: 2 })).toBe("11000001");
  });

  it("rejects too many decimals", () => {
    expect(() => parseDecimalToMinorUnits("0.001", { decimals: 2 })).toThrow();
  });

  it("converts minor units to decimal string", () => {
    expect(minorUnitsToDecimalString("10", { decimals: 2 })).toBe("0.10");
    expect(minorUnitsToDecimalString("11000001", { decimals: 2 })).toBe("110000.01");
  });
});

