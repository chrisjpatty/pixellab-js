import { describe, test, expect } from "bun:test";
import { mkdir, readFile } from "node:fs/promises";
import { Base64Image, type Keypoint } from "../src/index.js";
import {
  createTestClient,
  TEST_IMAGES_DIR,
  TEST_RESULTS_DIR,
  TEST_SKELETON_DIR,
} from "./helpers.js";

describe("animateWithSkeleton", () => {
  test("generates animation frames from skeleton poses", async () => {
    const client = await createTestClient();

    const referenceImage = await Base64Image.fromFile(
      `${TEST_IMAGES_DIR}/boy.png`
    );
    const freezeMask = await Base64Image.fromFile(
      `${TEST_IMAGES_DIR}/freeze_mask.png`
    );

    // Load skeleton keypoints from walk.json
    const walkJson = await readFile(`${TEST_SKELETON_DIR}/walk.json`, "utf-8");
    const walkData = JSON.parse(walkJson);
    const skeletonKeypoints = walkData.pose_keypoints as Keypoint[][];

    const inpaintingImages: (Base64Image | null)[] = [
      referenceImage,
      null,
      null,
    ];
    const maskImages: (Base64Image | null)[] = [freezeMask, null, null];

    const response = await client.animateWithSkeleton({
      view: "side",
      direction: "south",
      imageSize: { width: 32, height: 32 },
      referenceImage,
      inpaintingImages,
      maskImages,
      skeletonKeypoints,
    });

    expect(Array.isArray(response.images)).toBe(true);
    expect(response.images.length).toBe(3);
    expect(response.images[0]).toBeInstanceOf(Base64Image);
    expect(response.usage.type).toBe("usd");

    // Save result
    await mkdir(TEST_RESULTS_DIR, { recursive: true });

    // Save individual frames
    for (let i = 0; i < response.images.length; i++) {
      await response.images[i].saveToFile(
        `${TEST_RESULTS_DIR}/animate_skeleton_frame_${i}.png`
      );
    }

    console.log(
      `Generated ${response.images.length} skeleton animation frames`
    );
  });
});
