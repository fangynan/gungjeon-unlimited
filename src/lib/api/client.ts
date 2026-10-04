import type { ApiResponse } from "@/types";

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  /** Plain object to send as a JSON body. */
  json?: unknown;
  /** Use this instead of `json` for file uploads (FormData). */
  body?: BodyInit | null;
};

/**
 * Browser-side helper for calling our own /api routes.
 * Always resolves to the standard envelope; it never throws.
 * A 401 (signed out) sends the user to /login.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { json, headers, body, ...rest } = options;

  const finalHeaders = new Headers(headers);
  let finalBody = body;
  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    finalBody = JSON.stringify(json);
  }

  try {
    const res = await fetch(path, { ...rest, headers: finalHeaders, body: finalBody });

    if (res.status === 401 && typeof window !== "undefined") {
      const here = window.location.pathname;
      if (here !== "/login") {
        window.location.assign(`/login?next=${encodeURIComponent(here)}`);
      }
    }

    try {
      return (await res.json()) as ApiResponse<T>;
    } catch {
      return { success: false, data: null, error: `Unexpected response (${res.status}).` };
    }
  } catch {
    return {
      success: false,
      data: null,
      error: "Could not reach the server. Check your internet connection.",
    };
  }
}