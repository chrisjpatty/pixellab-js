import { readFile, writeFile } from "node:fs/promises";

// Base64 encoded image representation
export interface Base64ImageData {
  type: "base64";
  base64: string;
  format: string;
}

export class Base64Image implements Base64ImageData {
  readonly type = "base64" as const;
  readonly base64: string;
  readonly format: string;

  constructor(base64: string, format: string = "png") {
    this.base64 = base64;
    this.format = format;
  }

  // Create from a Buffer (e.g., from reading a file)
  static fromBuffer(buffer: Buffer, format: string = "png"): Base64Image {
    return new Base64Image(buffer.toString("base64"), format);
  }

  // Create from a file path (async)
  static async fromFile(filePath: string): Promise<Base64Image> {
    const buffer = await readFile(filePath);
    const format = filePath.split(".").pop() || "png";
    return new Base64Image(buffer.toString("base64"), format);
  }

  // Convert to Buffer
  toBuffer(): Buffer {
    return Buffer.from(this.base64, "base64");
  }

  // Save to a file (async)
  async saveToFile(filePath: string): Promise<void> {
    await writeFile(filePath, this.toBuffer());
  }

  // Get the data URL representation
  toDataURL(): string {
    const mimeType =
      this.format === "png"
        ? "image/png"
        : this.format === "jpg" || this.format === "jpeg"
          ? "image/jpeg"
          : `image/${this.format}`;
    return `data:${mimeType};base64,${this.base64}`;
  }

  // Serialize to plain object for API requests
  toJSON(): Base64ImageData {
    return {
      type: this.type,
      base64: this.base64,
      format: this.format,
    };
  }

  // Create from API response data
  static fromJSON(data: Base64ImageData): Base64Image {
    return new Base64Image(data.base64, data.format);
  }
}
