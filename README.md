# Pixel Lab JavaScript SDK

[![npm version](https://badge.fury.io/js/pixellab.svg)](https://badge.fury.io/js/pixellab)

This JavaScript/TypeScript client simplifies interaction with the [Pixel Lab developer API](http://api.pixellab.ai/v1).

Create characters and items, animate them, and generate rotated views. Useful for game development and other pixel art projects.

For questions or discussions, join us on [Discord](https://discord.gg/pBeyTBF8T7).

## Features

- **Generate Image (Pixflux)**: Create characters, items, and environments from text descriptions
- **Generate Image (Bitforge)**: Use reference images to match a specific art style
- **Animation with Skeletons**: Animate bi-pedal and quadrupedal characters and monsters with skeleton-based animations
- **Animation with Text**: Animate with text prompts
- **Inpainting**: Edit existing pixel art
- **Rotation**: Generate rotated views of characters and objects

With much more functionality coming soon.

## Installation

Use your preferred package manager:

```bash
npm install pixellab
```

or

```bash
bun add pixellab
```

## Usage

```typescript
import { PixelLabClient } from "pixellab";

const client = await PixelLabClient.fromEnvFile(".env.development.secrets");
// const client = PixelLabClient.fromEnv();
// const client = new PixelLabClient("my-secret");

// create image
const response = await client.generateImagePixflux({
  description: "cute dragon",
  imageSize: { width: 64, height: 64 },
});

await response.image.saveToFile("dragon.png");
```

See more client usage examples in the [Pixel Lab API Docs](https://api.pixellab.ai/v1/docs).

## Base64Image

The SDK uses a `Base64Image` class for image handling:

```typescript
import { Base64Image } from "pixellab";

// Load from file
const image = await Base64Image.fromFile("character.png");

// Create from buffer
const image = Base64Image.fromBuffer(buffer, "png");

// Save to file
await image.saveToFile("output.png");

// Get as buffer
const buffer = image.toBuffer();

// Get as data URL (for use in HTML img tags)
const dataUrl = image.toDataURL();
```

## Error Handling

The SDK throws typed errors for different failure modes:

- `AuthenticationError` - Invalid API key (401)
- `ValidationError` - Invalid parameters (422)
- `BadRequestError` - Bad request (400)
- `PixelLabError` - Base class for all API errors

```typescript
import { AuthenticationError, ValidationError, PixelLabError } from "pixellab";

try {
  await client.generateImagePixflux({
    description: "cute dragon",
    imageSize: { width: 64, height: 64 },
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof ValidationError) {
    console.error("Invalid parameters:", error.detail);
  } else if (error instanceof PixelLabError) {
    console.error("API error:", error.message, error.statusCode);
  }
}
```

## Development

### Install Dependencies

```bash
bun install
```

### Run Tests

```bash
bun test
```

## Support

- Documentation: [api.pixellab.ai/v1/docs](https://api.pixellab.ai/v1/docs)
- Discord Community: [Join us](https://discord.gg/pBeyTBF8T7)
- Issues: Please report any SDK issues on our GitHub repository
