import { beforeEach, describe, expect, it } from "vitest";
import {
  getReaderSnapshot,
  getServerReaderSnapshot,
  subscribeReader,
  writeReader,
} from "./reader";

describe("reader card store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null on the server snapshot", () => {
    expect(getServerReaderSnapshot()).toBeNull();
  });

  it("returns null when nothing is stored", () => {
    expect(getReaderSnapshot()).toBeNull();
  });

  it("writes and reads a trimmed reader card", () => {
    writeReader({ name: "  Eva Nováková  ", email: " eva@spst.sk " });
    expect(getReaderSnapshot()).toEqual({
      name: "Eva Nováková",
      email: "eva@spst.sk",
    });
  });

  it("ignores incomplete localStorage payloads", () => {
    window.localStorage.setItem(
      "spst-reader",
      JSON.stringify({ name: "Eva" }),
    );
    expect(getReaderSnapshot()).toBeNull();
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
