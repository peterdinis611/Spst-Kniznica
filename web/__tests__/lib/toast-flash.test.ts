import { afterEach, describe, expect, it } from "vitest";
import { consumeToastFlash, queueToastFlash } from "@/lib/toast-flash";

describe("toast-flash", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("queues and consumes a flash once", () => {
    queueToastFlash({
      kind: "info",
      title: "Odhlásený",
      description: "Prihlásenie bolo ukončené.",
    });

    expect(consumeToastFlash()).toEqual({
      kind: "info",
      title: "Odhlásený",
      description: "Prihlásenie bolo ukončené.",
    });
    expect(consumeToastFlash()).toBeNull();
  });
});
