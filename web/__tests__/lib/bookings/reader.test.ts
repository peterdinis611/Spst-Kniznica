import { beforeEach, describe, expect, it } from "vitest";
import {
  getReaderSnapshot,
  getServerReaderSnapshot,
  subscribeReader,
  writeReader,
} from "@/lib/bookings/reader";

describe("reader card store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("returns null on the server snapshot", () => {
    expect(getServerReaderSnapshot()).toBeNull();
  });

  it("returns null when nothing is stored", () => {
    expect(getReaderSnapshot()).toBeNull();
  });

  it("writes and reads a trimmed reader card in sessionStorage", () => {
    writeReader({ name: "  Eva Nováková  ", email: " eva@spst.sk " });
    expect(getReaderSnapshot()).toEqual({
      name: "Eva Nováková",
      email: "eva@spst.sk",
    });
    expect(window.localStorage.getItem("spst-reader")).toBeNull();
    expect(window.sessionStorage.getItem("spst-reader")).toBeTruthy();
  });

  it("ignores incomplete payloads", () => {
    window.sessionStorage.setItem(
      "spst-reader",
      JSON.stringify({ name: "Eva" }),
    );
    expect(getReaderSnapshot()).toBeNull();
  });

  it("migrates legacy localStorage into sessionStorage", () => {
    window.localStorage.setItem(
      "spst-reader",
      JSON.stringify({ name: "Eva", email: "eva@spst.sk" }),
    );
    expect(getReaderSnapshot()).toEqual({
      name: "Eva",
      email: "eva@spst.sk",
    });
    expect(window.localStorage.getItem("spst-reader")).toBeNull();
  });

  it("notifies subscribers after write", () => {
    let calls = 0;
    const unsubscribe = subscribeReader(() => {
      calls += 1;
    });

    writeReader({ name: "Eva", email: "eva@spst.sk" });
    expect(calls).toBe(1);

    unsubscribe();
    writeReader({ name: "Peter", email: "peter@spst.sk" });
    expect(calls).toBe(1);
  });
});
