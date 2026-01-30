import { describe, test, expect } from "bun:test";
import { mkdir } from "node:fs/promises";
import { Base64Image } from "../src/index.js";
import {
  createTestClient,
  TEST_IMAGES_DIR,
  TEST_RESULTS_DIR,
} from "./helpers.js";

describe("generateImageBitforge", () => {
  test("generates an image with style reference", async () => {
    const client = await createTestClient();

    const styleImage = await Base64Image.fromFile(`${TEST_IMAGES_DIR}/boy.png`);
    const inpaintingImage = await Base64Image.fromFile(
      `${TEST_IMAGES_DIR}/boy.png`
    );
    const maskImage = await Base64Image.fromFile(`${TEST_IMAGES_DIR}/mask.png`);
    const initImage = await Base64Image.fromFile(`${TEST_IMAGES_DIR}/boy.png`);

    const response = await client.generateImageBitforge({
      description: "boy with wings",
      imageSize: { width: 32, height: 32 },
      noBackground: true,
      styleImage,
      inpaintingImage,
      maskImage,
      initImage,
      initImageStrength: 250,
    });

    expect(response.image).toBeInstanceOf(Base64Image);
    expect(response.usage.type).toBe("usd");
    expect(typeof response.usage.usd).toBe("number");

    // Save result
    await mkdir(TEST_RESULTS_DIR, { recursive: true });
    await response.image.saveToFile(
      `${TEST_RESULTS_DIR}/bitforge_boy_with_wings.png`
    );
  });
});
