// Main client
export {
  PixelLabClient,
  type GenerateImageResponse,
  type AnimateResponse,
  type EstimateSkeletonResponse,
  type BalanceResponse,
} from "./client.js";

// Models
export { Base64Image, type Base64ImageData } from "./models/index.js";

// Types
export type {
  CameraView,
  Direction,
  Outline,
  Shading,
  Detail,
  SkeletonLabel,
  ImageSize,
  Keypoint,
  SkeletonFrame,
  Usage,
} from "./types.js";

// Errors
export {
  PixelLabError,
  AuthenticationError,
  ValidationError,
  BadRequestError,
} from "./errors.js";

// Convenience alias
export { PixelLabClient as Client } from "./client.js";
