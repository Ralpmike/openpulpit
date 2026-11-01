import "server-only";
import { ZodError, type ZodType } from "zod";

/** An error a route handler can show to people as-is. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const unauthorized = () => new ApiError(401, "Please sign in to continue.");
export const forbidden = (message = "You don't have permission to do that.") => new ApiError(403, message);
export const notFound = (message = "We couldn't find that. It may have been removed.") => new ApiError(404, message);
export const conflict = (message: string) => new ApiError(409, message);
export const badRequest = (message: string) => new ApiError(400, message);
export const tooManyRequests = () => new ApiError(429, "Too many tries. Please wait a moment and try again.");

const NO_STORE = { "cache-control": "no-store" };

export function ok<T>(data: T, init: ResponseInit = {}): Response {
  return Response.json({ data }, { ...init, headers: { ...NO_STORE, ...init.headers } });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    const field = (error as ApiError & { field?: string }).field;
    return Response.json(field ? { error: error.message, field } : { error: error.message }, {
      status: error.status,
      headers: NO_STORE,
    });
  }
  if (error instanceof ZodError) {
    const first = error.issues[0];
    const field = first?.path.join(".");
    return Response.json(
      { error: first ? `${field ? `${field}: ` : ""}${first.message}` : "Please check what you entered." },
      { status: 400, headers: NO_STORE },
    );
  }
  console.error("Unhandled API error", error);
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500, headers: NO_STORE });
}

/** Wraps a route handler: ApiError and ZodError become `{ error }` responses. */
export function route<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/** Parses a JSON body with a Zod schema; refuses anything that isn't JSON. */
export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw badRequest("Send the request as JSON.");
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw badRequest("Send the request as JSON.");
  }
  return schema.parse(body);
}
