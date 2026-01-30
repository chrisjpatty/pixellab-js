import { describe, test, expect } from "bun:test";
import { mkdir } from "node:fs/promises";
import { Base64Image } from "../src/index.js";
import {
  createTestClient,
  TEST_IMAGES_DIR,
  TEST_RESULTS_DIR,
} from "./helpers.js";

describe("inpaint", () => {
  test("edits regions of an image", async () => {
    const client = await createTestClient();

    const inpaintingImage = await Base64Image.fromFile(
      `${TEST_IMAGES_DIR}/boy.png`
    );
    const maskImage = await Base64Image.fromFile(`${TEST_IMAGES_DIR}/mask.png`);

    const response = await client.inpaint({
      description: "boy wearing a hat",
      imageSize: { width: 32, height: 32 },
      inpaintingImage,
      maskImage,
    });

    expect(response.image).toBeInstanceOf(Base64Image);
    expect(response.usage.type).toBe("usd");

    // Save result
    await mkdir(TEST_RESULTS_DIR, { recursive: true });
    await response.image.saveToFile(`${TEST_RESULTS_DIR}/inpaint_boy_hat.png`);
  });
});
