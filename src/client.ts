import { readFile } from "node:fs/promises";
import {
  AuthenticationError,
  BadRequestError,
  PixelLabError,
  ValidationError,
} from "./errors.js";
import { Base64Image, type Base64ImageData } from "./models/base64-image.js";
import type {
  CameraView,
  Detail,
  Direction,
  ImageSize,
  Keypoint,
  Outline,
  Shading,
  SkeletonFrame,
  Usage,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.pixellab.ai/v1";

// Response types
export interface GenerateImageResponse {
  image: Base64Image;
  usage: Usage;
}

export interface AnimateResponse {
  images: Base64Image[];
  usage: Usage;
}

export interface EstimateSkeletonResponse {
  keypoints: Keypoint[];
  usage: Usage;
}

export interface BalanceResponse {
  type: "usd";
  usd: number;
}

// Helper to convert camelCase to snake_case
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Convert object keys from camelCase to snake_case
function convertKeysToSnakeCase(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCase(key)] = value;
  }
  return result;
}

export class PixelLabClient {
  private secret: string;
  private baseUrl: string;

  constructor(secret: string, baseUrl: string = DEFAULT_BASE_URL) {
    this.secret = secret;
    this.baseUrl = baseUrl;
  }

  // Create client from environment variables
  // Looks for PIXELLAB_SECRET or PIXELLAB_API_KEY
  static fromEnv(): PixelLabClient {
    const secret = process.env.PIXELLAB_SECRET || process.env.PIXELLAB_API_KEY;
    if (!secret) {
      throw new Error(
        "PIXELLAB_SECRET or PIXELLAB_API_KEY environment variable is not set"
      );
    }
    const baseUrl = process.env.PIXELLAB_BASE_URL || DEFAULT_BASE_URL;
    return new PixelLabClient(secret, baseUrl);
  }

  // Create client from a .env file
  // Looks for PIXELLAB_SECRET or PIXELLAB_API_KEY
  static async fromEnvFile(envFile: string): Promise<PixelLabClient> {
    const content = await readFile(envFile, "utf-8");

    const env: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        let value = valueParts.join("=");
        // Remove surrounding quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        env[key.trim()] = value;
      }
    }

    const secret = env.PIXELLAB_SECRET || env.PIXELLAB_API_KEY;
    if (!secret) {
      throw new Error(
        `PIXELLAB_SECRET or PIXELLAB_API_KEY not found in ${envFile}`
      );
    }
    const baseUrl = env.PIXELLAB_BASE_URL || DEFAULT_BASE_URL;
    return new PixelLabClient(secret, baseUrl);
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.secret}`,
      "Content-Type": "application/json",
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      return response.json() as Promise<T>;
    }

    let detail: unknown;
    try {
      const errorBody = (await response.json()) as Record<string, unknown>;
      detail = errorBody.detail ?? errorBody;
    } catch {
      detail = await response.text();
    }

    const message =
      typeof detail === "string" ? detail : JSON.stringify(detail);

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message, detail);
      case 400:
        throw new BadRequestError(message, detail);
      case 422:
        throw new ValidationError(message, detail);
      default:
        throw new PixelLabError(message, response.status, detail);
    }
  }

  private async post<T>(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  private async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: this.headers,
    });
    return this.handleResponse<T>(response);
  }

  // Convert Base64Image to JSON for API request, or null if undefined
  private imageToJson(
    image: Base64Image | undefined
  ): Base64ImageData | null {
    return image ? image.toJSON() : null;
  }

  // Convert array of Base64Image to JSON for API request
  private imagesToJson(
    images: (Base64Image | null | undefined)[] | undefined
  ): (Base64ImageData | null)[] | null {
    if (!images) return null;
    return images.map((img) => (img ? img.toJSON() : null));
  }

  // Convert skeleton frames to the format expected by API
  // API expects SkeletonFrame format: [{keypoints: [...]}, ...]
  private skeletonFramesToJson(
    frames: SkeletonFrame[] | Keypoint[][] | undefined
  ): SkeletonFrame[] | null {
    if (!frames) return null;
    // Handle both formats: array of SkeletonFrame objects or array of keypoint arrays
    return frames.map((frame) =>
      Array.isArray(frame) ? { keypoints: frame } : frame
    );
  }

  // ===== API Methods =====

  async getBalance(): Promise<BalanceResponse> {
    return this.get<BalanceResponse>("/balance");
  }

  async generateImagePixflux(options: {
    description: string;
    imageSize: ImageSize;
    negativeDescription?: string;
    textGuidanceScale?: number;
    outline?: Outline;
    shading?: Shading;
    detail?: Detail;
    view?: CameraView;
    direction?: Direction;
    isometric?: boolean;
    noBackground?: boolean;
    coveragePercentage?: number;
    initImage?: Base64Image;
    initImageStrength?: number;
    colorImage?: Base64Image;
    seed?: number;
  }): Promise<GenerateImageResponse> {
    const body = convertKeysToSnakeCase({
      description: options.description,
      imageSize: options.imageSize,
      negativeDescription: options.negativeDescription ?? "",
      textGuidanceScale: options.textGuidanceScale ?? 8,
      outline: options.outline ?? null,
      shading: options.shading ?? null,
      detail: options.detail ?? null,
      view: options.view ?? null,
      direction: options.direction ?? null,
      isometric: options.isometric ?? false,
      noBackground: options.noBackground ?? false,
      coveragePercentage: options.coveragePercentage ?? null,
      initImage: this.imageToJson(options.initImage),
      initImageStrength: options.initImageStrength ?? 300,
      colorImage: this.imageToJson(options.colorImage),
      seed: options.seed ?? 0,
    });

    const response = await this.post<{
      image: Base64ImageData;
      usage: Usage;
    }>("/generate-image-pixflux", body);

    return {
      image: Base64Image.fromJSON(response.image),
      usage: response.usage,
    };
  }

  async generateImageBitforge(options: {
    description: string;
    imageSize: ImageSize;
    negativeDescription?: string;
    textGuidanceScale?: number;
    extraGuidanceScale?: number;
    skeletonGuidanceScale?: number;
    styleStrength?: number;
    noBackground?: boolean;
    seed?: number;
    outline?: Outline;
    shading?: Shading;
    detail?: Detail;
    view?: CameraView;
    direction?: Direction;
    isometric?: boolean;
    obliqueProjection?: boolean;
    coveragePercentage?: number;
    initImage?: Base64Image;
    initImageStrength?: number;
    styleImage?: Base64Image;
    inpaintingImage?: Base64Image;
    maskImage?: Base64Image;
    skeletonKeypoints?: SkeletonFrame | Keypoint[];
    colorImage?: Base64Image;
  }): Promise<GenerateImageResponse> {
    // Handle skeleton keypoints - can be SkeletonFrame object or array of Keypoint
    // API expects SkeletonFrame format: {keypoints: Keypoint[]}
    const skeletonKeypoints = options.skeletonKeypoints
      ? Array.isArray(options.skeletonKeypoints)
        ? { keypoints: options.skeletonKeypoints } // Wrap raw array in SkeletonFrame
        : options.skeletonKeypoints // Already a SkeletonFrame, use as-is
      : null;

    const body = convertKeysToSnakeCase({
      description: options.description,
      imageSize: options.imageSize,
      negativeDescription: options.negativeDescription ?? "",
      textGuidanceScale: options.textGuidanceScale ?? 3.0,
      extraGuidanceScale: options.extraGuidanceScale ?? 3.0,
      skeletonGuidanceScale: options.skeletonGuidanceScale ?? 1.0,
      styleStrength: options.styleStrength ?? 0.0,
      noBackground: options.noBackground ?? false,
      seed: options.seed ?? 0,
      outline: options.outline ?? null,
      shading: options.shading ?? null,
      detail: options.detail ?? null,
      view: options.view ?? null,
      direction: options.direction ?? null,
      isometric: options.isometric ?? false,
      obliqueProjection: options.obliqueProjection ?? false,
      coveragePercentage: options.coveragePercentage ?? null,
      initImage: this.imageToJson(options.initImage),
      initImageStrength: options.initImageStrength ?? 300,
      styleImage: this.imageToJson(options.styleImage),
      inpaintingImage: this.imageToJson(options.inpaintingImage),
      maskImage: this.imageToJson(options.maskImage),
      skeletonKeypoints: skeletonKeypoints,
      colorImage: this.imageToJson(options.colorImage),
    });

    const response = await this.post<{
      image: Base64ImageData;
      usage: Usage;
    }>("/generate-image-bitforge", body);

    return {
      image: Base64Image.fromJSON(response.image),
      usage: response.usage,
    };
  }

  async estimateSkeleton(options: {
    image: Base64Image;
  }): Promise<EstimateSkeletonResponse> {
    const body = {
      image: options.image.toJSON(),
    };

    return this.post<EstimateSkeletonResponse>("/estimate-skeleton", body);
  }

  async inpaint(options: {
    description: string;
    imageSize: ImageSize;
    inpaintingImage: Base64Image;
    maskImage: Base64Image;
    negativeDescription?: string;
    textGuidanceScale?: number;
    extraGuidanceScale?: number;
    outline?: Outline;
    shading?: Shading;
    detail?: Detail;
    view?: CameraView;
    direction?: Direction;
    isometric?: boolean;
    obliqueProjection?: boolean;
    noBackground?: boolean;
    initImage?: Base64Image;
    initImageStrength?: number;
    colorImage?: Base64Image;
    seed?: number;
  }): Promise<GenerateImageResponse> {
    const body = convertKeysToSnakeCase({
      description: options.description,
      imageSize: options.imageSize,
      inpaintingImage: options.inpaintingImage.toJSON(),
      maskImage: options.maskImage.toJSON(),
      negativeDescription: options.negativeDescription ?? "",
      textGuidanceScale: options.textGuidanceScale ?? 3.0,
      extraGuidanceScale: options.extraGuidanceScale ?? 3.0,
      outline: options.outline ?? null,
      shading: options.shading ?? null,
      detail: options.detail ?? null,
      view: options.view ?? null,
      direction: options.direction ?? null,
      isometric: options.isometric ?? false,
      obliqueProjection: options.obliqueProjection ?? false,
      noBackground: options.noBackground ?? false,
      initImage: this.imageToJson(options.initImage),
      initImageStrength: options.initImageStrength ?? 300,
      colorImage: this.imageToJson(options.colorImage),
      seed: options.seed ?? 0,
    });

    const response = await this.post<{
      image: Base64ImageData;
      usage: Usage;
    }>("/inpaint", body);

    return {
      image: Base64Image.fromJSON(response.image),
      usage: response.usage,
    };
  }

  async rotate(options: {
    imageSize: ImageSize;
    fromImage: Base64Image;
    fromView?: CameraView;
    toView?: CameraView;
    fromDirection?: Direction;
    toDirection?: Direction;
    viewChange?: number;
    directionChange?: number;
    imageGuidanceScale?: number;
    isometric?: boolean;
    obliqueProjection?: boolean;
    initImage?: Base64Image;
    initImageStrength?: number;
    maskImage?: Base64Image;
    colorImage?: Base64Image;
    seed?: number;
  }): Promise<GenerateImageResponse> {
    const body = convertKeysToSnakeCase({
      imageSize: options.imageSize,
      fromImage: options.fromImage.toJSON(),
      fromView: options.fromView ?? null,
      toView: options.toView ?? null,
      fromDirection: options.fromDirection ?? null,
      toDirection: options.toDirection ?? null,
      viewChange: options.viewChange ?? null,
      directionChange: options.directionChange ?? null,
      imageGuidanceScale: options.imageGuidanceScale ?? 3.0,
      isometric: options.isometric ?? false,
      obliqueProjection: options.obliqueProjection ?? false,
      initImage: this.imageToJson(options.initImage),
      initImageStrength: options.initImageStrength ?? 300,
      maskImage: this.imageToJson(options.maskImage),
      colorImage: this.imageToJson(options.colorImage),
      seed: options.seed ?? 0,
    });

    const response = await this.post<{
      image: Base64ImageData;
      usage: Usage;
    }>("/rotate", body);

    return {
      image: Base64Image.fromJSON(response.image),
      usage: response.usage,
    };
  }

  async animateWithText(options: {
    imageSize: ImageSize;
    description: string;
    action: string;
    referenceImage: Base64Image;
    view?: CameraView;
    direction?: Direction;
    negativeDescription?: string;
    textGuidanceScale?: number;
    imageGuidanceScale?: number;
    nFrames?: number;
    startFrameIndex?: number;
    initImages?: (Base64Image | null)[];
    initImageStrength?: number;
    inpaintingImages?: (Base64Image | null)[];
    maskImages?: (Base64Image | null)[];
    colorImage?: Base64Image;
    seed?: number;
  }): Promise<AnimateResponse> {
    const nFrames = options.nFrames ?? 4;

    const body = convertKeysToSnakeCase({
      imageSize: options.imageSize,
      description: options.description,
      action: options.action,
      referenceImage: options.referenceImage.toJSON(),
      view: options.view ?? "side",
      direction: options.direction ?? "east",
      negativeDescription: options.negativeDescription ?? null,
      textGuidanceScale: options.textGuidanceScale ?? 7.5,
      imageGuidanceScale: options.imageGuidanceScale ?? 1.5,
      nFrames: nFrames,
      startFrameIndex: options.startFrameIndex ?? 0,
      initImages: this.imagesToJson(options.initImages),
      initImageStrength: options.initImageStrength ?? 300,
      inpaintingImages:
        this.imagesToJson(options.inpaintingImages) ??
        new Array(nFrames).fill(null),
      maskImages: this.imagesToJson(options.maskImages),
      colorImage: this.imageToJson(options.colorImage),
      seed: options.seed ?? 0,
    });

    const response = await this.post<{
      images: Base64ImageData[];
      usage: Usage;
    }>("/animate-with-text", body);

    return {
      images: response.images.map((img) => Base64Image.fromJSON(img)),
      usage: response.usage,
    };
  }

  async animateWithSkeleton(options: {
    imageSize: ImageSize;
    skeletonKeypoints: SkeletonFrame[] | Keypoint[][];
    view: CameraView;
    direction: Direction;
    referenceGuidanceScale?: number;
    poseGuidanceScale?: number;
    isometric?: boolean;
    obliqueProjection?: boolean;
    initImages?: (Base64Image | null)[];
    initImageStrength?: number;
    referenceImage?: Base64Image;
    inpaintingImages?: (Base64Image | null)[];
    maskImages?: (Base64Image | null)[];
    colorImage?: Base64Image;
    seed?: number;
  }): Promise<AnimateResponse> {
    const body = convertKeysToSnakeCase({
      imageSize: options.imageSize,
      skeletonKeypoints: this.skeletonFramesToJson(options.skeletonKeypoints),
      view: options.view,
      direction: options.direction,
      referenceGuidanceScale: options.referenceGuidanceScale ?? 1.1,
      poseGuidanceScale: options.poseGuidanceScale ?? 3.0,
      isometric: options.isometric ?? false,
      obliqueProjection: options.obliqueProjection ?? false,
      initImages: this.imagesToJson(options.initImages),
      initImageStrength: options.initImageStrength ?? 300,
      referenceImage: this.imageToJson(options.referenceImage),
      inpaintingImages: this.imagesToJson(options.inpaintingImages),
      maskImages: this.imagesToJson(options.maskImages),
      colorImage: this.imageToJson(options.colorImage),
      seed: options.seed ?? 0,
    });

    const response = await this.post<{
      images: Base64ImageData[];
      usage: Usage;
    }>("/animate-with-skeleton", body);

    return {
      images: response.images.map((img) => Base64Image.fromJSON(img)),
      usage: response.usage,
    };
  }
}
