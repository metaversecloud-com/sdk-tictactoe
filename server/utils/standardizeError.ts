/**
 * Creates a standardized error object from various error types.
 * This helps provide consistent error formatting across the application.
 */
export const standardizeError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  if (typeof error === "object" && error !== null) {
    const message = (error as any).message || JSON.stringify(error);
    const newError = new Error(message);
    (newError as any).originalError = error;
    return newError;
  }
  return new Error(`Unknown error: ${String(error)}`);
};
