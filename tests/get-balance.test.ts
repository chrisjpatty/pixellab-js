import { describe, test, expect } from "bun:test";
import { createTestClient } from "./helpers.js";

describe("getBalance", () => {
  test("returns balance in USD", async () => {
    const client = await createTestClient();

    const response = await client.getBalance();

    console.log(`Balance: $${response.usd}`);
    expect(response.type).toBe("usd");
    expect(typeof response.usd).toBe("number");
    expect(response.usd).toBeGreaterThanOrEqual(0);
  });
});
