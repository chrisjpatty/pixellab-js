// Base error class for Pixel Lab API errors
export class PixelLabError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public detail?: unknown
  ) {
    super(message);
    this.name = "PixelLabError";
  }
}

// Authentication error (401)
export class AuthenticationError extends PixelLabError {
  constructor(message: string, detail?: unknown) {
    super(message, 401, detail);
    this.name = "AuthenticationError";
  }
}

// Validation error (422)
export class ValidationError extends PixelLabError {
  constructor(message: string, detail?: unknown) {
    super(message, 422, detail);
    this.name = "ValidationError";
  }
}

// Bad request error (400)
export class BadRequestError extends PixelLabError {
  constructor(message: string, detail?: unknown) {
    super(message, 400, detail);
    this.name = "BadRequestError";
  }
}
