import { describe, test, expect } from "bun:test";
import { mkdir } from "node:fs/promises";
import { Base64Image } from "../src/index.js";
import { createTestClient, TEST_RESULTS_DIR } from "./helpers.js";

describe("generateImagePixflux", () => {
  test("generates an image from text description", async () => {
    const client = await createTestClient();

    const response = await client.generateImagePixflux({
      description: "a small robot",
      imageSize: { width: 32, height: 32 },
      noBackground: true,
    });

    expect(response.image).toBeInstanceOf(Base64Image);
    expect(response.usage.type).toBe("usd");
    expect(typeof response.usage.usd).toBe("number");

    // Save result
    await mkdir(TEST_RESULTS_DIR, { recursive: true });
    await response.image.saveToFile(`${TEST_RESULTS_DIR}/pixflux_robot.png`);
  });
});
