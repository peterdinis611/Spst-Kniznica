import { describe, expect, it } from "vitest";
import { explainBookingError } from "@/lib/bookings/errors";

describe("explainBookingError", () => {
  it("translates field validation messages", () => {
    expect(explainBookingError("BorrowerEmail is invalid")).toBe(
      "Email nie je v správnom tvare.",
    );
    expect(explainBookingError("BorrowerName required")).toBe(
      "Meno čitateľa je povinné.",
    );
    expect(explainBookingError("DueDate missing")).toBe(
      "Vyber termín vrátenia.",
    );
  });

  it("explains copy conflicts", () => {
    expect(explainBookingError("BookCopyId already reserved")).toBe(
      "Tento exemplár už má aktívnu výpožičku.",
    );
    expect(explainBookingError("Active reservation exists")).toBe(
      "Tento exemplár už má aktívnu výpožičku.",
    );
  });

  it("explains connectivity failures", () => {
    expect(explainBookingError("API 503: /api/bookings")).toContain(
      "Výpožičný pult neodpovedá",
    );
    expect(explainBookingError("fetch failed")).toContain(
      "Výpožičný pult neodpovedá",
    );
    expect(explainBookingError("ECONNREFUSED")).toContain(
      "Výpožičný pult neodpovedá",
    );
  });

  it("passes through unknown messages", () => {
    expect(explainBookingError("Niečo iné")).toBe("Niečo iné");
  });
});
