import { describe, test, expect } from "bun:test";
import { mkdir } from "node:fs/promises";
import { Base64Image } from "../src/index.js";
import {
  createTestClient,
  TEST_IMAGES_DIR,
  TEST_RESULTS_DIR,
} from "./helpers.js";

describe("animateWithText", () => {
  test("generates animation frames from text description", async () => {
    const client = await createTestClient();

    const referenceImage = await Base64Image.fromFile(
      `${TEST_IMAGES_DIR}/boy.png`
    );

    const response = await client.animateWithText({
      imageSize: { width: 32, height: 32 },
      description: "small boy character",
      action: "walking",
      referenceImage,
      nFrames: 4,
    });

    expect(Array.isArray(response.images)).toBe(true);
    expect(response.images.length).toBe(4);
    expect(response.images[0]).toBeInstanceOf(Base64Image);
    expect(response.usage.type).toBe("usd");

    // Save result
    await mkdir(TEST_RESULTS_DIR, { recursive: true });

    // Save individual frames
    for (let i = 0; i < response.images.length; i++) {
      await response.images[i].saveToFile(
        `${TEST_RESULTS_DIR}/animate_text_frame_${i}.png`
      );
    }

    console.log(`Generated ${response.images.length} animation frames`);
  });
});
