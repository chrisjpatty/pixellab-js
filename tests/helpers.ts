import { access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { PixelLabClient } from "../src/index.js";

// Check if a file exists
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Find the .env file, searching in common locations
export async function createTestClient(): Promise<PixelLabClient> {
  // Get the directory of this file
  const thisDir = dirname(new URL(import.meta.url).pathname);
  const packageDir = resolve(thisDir, "..");
  const projectRoot = resolve(packageDir, "../..");
  const mapBuilderDir = resolve(projectRoot, "packages/map-builder");

  // Try multiple locations
  const envPaths = [
    resolve(projectRoot, ".env.development.secrets"), // Root (Python SDK pattern)
    resolve(packageDir, ".env.development.secrets"), // Package dir
    resolve(mapBuilderDir, ".env"), // Map builder .env (has PIXELLAB_API_KEY)
    resolve(projectRoot, ".env"), // Root .env
  ];

  for (const envPath of envPaths) {
    if (await fileExists(envPath)) {
      console.log(`Using env file: ${envPath}`);
      return await PixelLabClient.fromEnvFile(envPath);
    }
  }

  // Fall back to environment variables
  console.log("Using environment variables");
  return PixelLabClient.fromEnv();
}

// Path to test images directory
export const TEST_IMAGES_DIR = resolve(
  dirname(new URL(import.meta.url).pathname),
  "images"
);

// Path to skeleton points directory
export const TEST_SKELETON_DIR = resolve(
  dirname(new URL(import.meta.url).pathname),
  "skeleton-points"
);

// Path to results directory
export const TEST_RESULTS_DIR = resolve(
  dirname(new URL(import.meta.url).pathname),
  "results"
);
