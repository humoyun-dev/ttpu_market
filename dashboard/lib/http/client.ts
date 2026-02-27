import { env } from "@/lib/env/env";
import { HttpError } from "@/lib/http/errors";
import { safeHeaders } from "@/lib/http/headers";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  headers?: HeadersInit;
  body?: unknown;
  signal?: AbortSignal;
};

export async function httpClient<TResponse>(
  path: string,
  options: RequestOptions = {}
): Promise<TResponse> {
  const url = env.NEXT_PUBLIC_API_BASE_URL
    ? new URL(path, env.NEXT_PUBLIC_API_BASE_URL).toString()
    : path;

  const res = await fetch(url, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...safeHeaders(options.headers),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data: unknown = await res.json();
      if (typeof data === "object" && data && "message" in data) {
        const maybeMessage = (data as { message?: unknown }).message;
        if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
          message = maybeMessage;
        }
      }
    } catch {
      // ignore
    }
    throw new HttpError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as TResponse;
  }

  return (await res.json()) as TResponse;
}

