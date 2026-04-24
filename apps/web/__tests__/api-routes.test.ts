/**
 * Unit tests for pure helper logic used in Next.js API routes.
 * Tests do not hit the database — they exercise the data-transformation
 * and arithmetic used inside the route handlers.
 */

import { describe, expect, it } from "vitest";

// ── Helpers mirrored from route implementations ───────────────────────────────

function pct(n: number, total: number): number {
  return total > 0 ? parseFloat(((n / total) * 100).toFixed(1)) : 0;
}

function candidateStatus(
  qualifiesUniversity: boolean,
  totalPasses: number
): "qualify" | "borderline" | "no-qualify" {
  if (qualifiesUniversity) return "qualify";
  if (totalPasses >= 5) return "borderline";
  return "no-qualify";
}

function passRate(passes: number, total: number): number {
  return total > 0 ? parseFloat(((passes / total) * 100).toFixed(1)) : 0;
}

function pivotYearData(
  rows: { year: number; subject: string; passes: string; total: string }[]
): Record<string, number | string>[] {
  const pivot = new Map<string, Record<string, number | string>>();
  for (const row of rows) {
    if (!pivot.has(row.subject)) pivot.set(row.subject, { subject: row.subject });
    const t = parseInt(row.total);
    const p = parseInt(row.passes);
    pivot.get(row.subject)![String(row.year)] = passRate(p, t);
  }
  return [...pivot.values()];
}


// ── pct() ─────────────────────────────────────────────────────────────────────

describe("pct helper", () => {
  it("computes percentage to one decimal place", () => {
    expect(pct(734, 909)).toBe(80.7);
  });

  it("returns 0 when total is 0", () => {
    expect(pct(10, 0)).toBe(0);
  });

  it("returns 100 when all qualify", () => {
    expect(pct(50, 50)).toBe(100);
  });

  it("rounds correctly", () => {
    expect(pct(1, 3)).toBe(33.3);
  });
});


// ── candidateStatus() ─────────────────────────────────────────────────────────

describe("candidateStatus helper", () => {
  it("returns qualify when qualifiesUniversity is true", () => {
    expect(candidateStatus(true, 8)).toBe("qualify");
  });

  it("returns borderline when 5+ passes and not qualifying", () => {
    expect(candidateStatus(false, 5)).toBe("borderline");
    expect(candidateStatus(false, 6)).toBe("borderline");
  });

  it("returns no-qualify when fewer than 5 passes", () => {
    expect(candidateStatus(false, 4)).toBe("no-qualify");
    expect(candidateStatus(false, 0)).toBe("no-qualify");
  });
});


// ── passRate() ────────────────────────────────────────────────────────────────

describe("passRate helper", () => {
  it("returns 100 when all pass", () => {
    expect(passRate(50, 50)).toBe(100);
  });

  it("returns 0 when none pass", () => {
    expect(passRate(0, 50)).toBe(0);
  });

  it("returns 0 when total is 0", () => {
    expect(passRate(0, 0)).toBe(0);
  });

  it("returns correct rate for partial pass", () => {
    expect(passRate(90, 100)).toBe(90);
    expect(passRate(1, 3)).toBe(33.3);
  });
});


// ── pivotYearData() ───────────────────────────────────────────────────────────

describe("pivotYearData (compare route logic)", () => {
  it("pivots rows into subject-keyed objects with year columns", () => {
    const rows = [
      { year: 2023, subject: "ENGLISH LANGUAGE", passes: "90", total: "100" },
      { year: 2024, subject: "ENGLISH LANGUAGE", passes: "95", total: "100" },
      { year: 2023, subject: "MATHEMATICS(CORE)", passes: "80", total: "100" },
    ];
    const result = pivotYearData(rows);
    expect(result).toHaveLength(2);

    const english = result.find((r) => r.subject === "ENGLISH LANGUAGE");
    expect(english?.["2023"]).toBe(90);
    expect(english?.["2024"]).toBe(95);

    const maths = result.find((r) => r.subject === "MATHEMATICS(CORE)");
    expect(maths?.["2023"]).toBe(80);
    expect(maths?.["2024"]).toBeUndefined();
  });

  it("handles empty input", () => {
    expect(pivotYearData([])).toHaveLength(0);
  });
});


// ── Subject grade pivot ────────────────────────────────────────────────────────

describe("subject grade parsing (subjects route logic)", () => {
  it("converts string aggregate counts to integers", () => {
    const raw = { A1: "45", B2: "35", passes: "80", total: 100 };
    const grades = {
      A1: parseInt(raw.A1),
      B2: parseInt(raw.B2),
    };
    const rate = passRate(parseInt(raw.passes), raw.total);
    expect(grades.A1).toBe(45);
    expect(grades.B2).toBe(35);
    expect(rate).toBe(80);
  });
});
