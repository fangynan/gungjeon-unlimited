import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import { ApiError } from "./errors";

// Table status must be fresh and responses can depend on the session: never cache.
const HEADERS = { "Cache-Control": "no-store" };

function envelope<T>(body: ApiResponse<T>, status: number) {
  return NextResponse.json(body, { status, headers: HEADERS });
}

/** 200 */
export function ok<T>(data: T, message?: string) {
  return envelope<T>({ success: true, data, error: null, ...(message && { message }) }, 200);
}

/** 201 */
export function created<T>(data: T, message?: string) {
  return envelope<T>({ success: true, data, error: null, ...(message && { message }) }, 201);
}

/** Any error status, standard envelope. */
export function fail(status: number, error: string) {
  return envelope<null>({ success: false, data: null, error }, status);
}

/** Convert anything thrown into the standard error envelope. */
export function errorResponse(err: unknown) {
  if (err instanceof ApiError) return fail(err.status, err.message);
  console.error("[api] unhandled error:", err);
  return fail(500, "Internal server error.");
}

/**
 * Wrap a route handler so that thrown ApiErrors (401/403/400/404...) and unexpected
 * exceptions (500) are always returned as the standard envelope. Preserves the
 * handler's own parameter types, so Next's route typing still works.
 */
export function withApi<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
