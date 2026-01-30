// Camera view perspectives
export type CameraView = "side" | "low top-down" | "high top-down";

// 8 cardinal and intercardinal directions
export type Direction =
  | "south"
  | "south-east"
  | "east"
  | "north-east"
  | "north"
  | "north-west"
  | "west"
  | "south-west";

// Outline styles
export type Outline =
  | "single color black outline"
  | "single color outline"
  | "selective outline"
  | "lineless";

// Shading levels
export type Shading =
  | "flat shading"
  | "basic shading"
  | "medium shading"
  | "detailed shading"
  | "highly detailed shading";

// Detail levels
export type Detail = "low detail" | "medium detail" | "highly detailed";

// Skeleton body part labels
export type SkeletonLabel =
  | "NOSE"
  | "NECK"
  | "RIGHT SHOULDER"
  | "RIGHT ELBOW"
  | "RIGHT ARM"
  | "LEFT SHOULDER"
  | "LEFT ELBOW"
  | "LEFT ARM"
  | "RIGHT HIP"
  | "RIGHT KNEE"
  | "RIGHT LEG"
  | "LEFT HIP"
  | "LEFT KNEE"
  | "LEFT LEG"
  | "RIGHT EYE"
  | "LEFT EYE"
  | "RIGHT EAR"
  | "LEFT EAR";

// Image dimensions
export interface ImageSize {
  width: number;
  height: number;
}

// Skeleton keypoint
export interface Keypoint {
  x: number;
  y: number;
  label: SkeletonLabel;
  z_index?: number;
}

// Frame of skeleton keypoints for animation
export interface SkeletonFrame {
  keypoints: Keypoint[];
}

// Usage/cost information
export interface Usage {
  type: "usd";
  usd: number;
}
