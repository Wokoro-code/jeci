import { describe, expect, it } from "vitest";
import { requireActiveAccount, requireVerifiedAccount } from "./permissions";

describe("JEC account permissions", () => {
  it("allows interactions only to verified members", () => { expect(() => requireVerifiedAccount("verified")).not.toThrow(); expect(() => requireVerifiedAccount("pending_verification")).toThrow(); });
  it("blocks suspended and deactivated accounts", () => { expect(() => requireActiveAccount("suspended")).toThrow(); expect(() => requireActiveAccount("deactivated")).toThrow(); expect(() => requireActiveAccount("pending_verification")).not.toThrow(); });
  it("keeps pending accounts in reading mode while retaining profile access", () => { expect(() => requireActiveAccount("pending_verification")).not.toThrow(); expect(() => requireVerifiedAccount("pending_verification")).toThrow(); });
});
