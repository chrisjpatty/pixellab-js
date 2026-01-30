import { describe, test, expect } from "bun:test";
import { mkdir } from "node:fs/promises";
import { Base64Image } from "../src/index.js";
import {
  createTestClient,
  TEST_IMAGES_DIR,
  TEST_RESULTS_DIR,
} from "./helpers.js";

describe("rotate", () => {
  test("generates a rotated view of an image", async () => {
    const client = await createTestClient();

    const fromImage = await Base64Image.fromFile(`${TEST_IMAGES_DIR}/boy.png`);

    const response = await client.rotate({
      imageSize: { width: 32, height: 32 },
      fromImage,
      fromDirection: "south",
      toDirection: "east",
    });

    expect(response.image).toBeInstanceOf(Base64Image);
    expect(response.usage.type).toBe("usd");

    // Save result
    await mkdir(TEST_RESULTS_DIR, { recursive: true });
    await response.image.saveToFile(
      `${TEST_RESULTS_DIR}/rotate_south_to_east.png`
    );
  });
});
