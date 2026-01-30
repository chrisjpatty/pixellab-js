import { describe, test, expect } from "bun:test";
import { Base64Image } from "../src/index.js";
import { createTestClient, TEST_IMAGES_DIR } from "./helpers.js";

describe("estimateSkeleton", () => {
  test("extracts skeleton keypoints from an image", async () => {
    const client = await createTestClient();

    const image = await Base64Image.fromFile(`${TEST_IMAGES_DIR}/boy.png`);

    const response = await client.estimateSkeleton({ image });

    expect(Array.isArray(response.keypoints)).toBe(true);
    expect(response.keypoints.length).toBeGreaterThan(0);
    expect(response.usage.type).toBe("usd");

    // Verify keypoint structure
    const keypoint = response.keypoints[0];
    expect(typeof keypoint.x).toBe("number");
    expect(typeof keypoint.y).toBe("number");
    expect(typeof keypoint.label).toBe("string");

    console.log(`Found ${response.keypoints.length} keypoints`);
  });
});
