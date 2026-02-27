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

function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    const internal = process.env.API_INTERNAL_BASE_URL;
    if (typeof internal === "string" && internal.length > 0) {
      try {
        new URL(internal);
        return internal;
      } catch {
        // ignore invalid internal base url
      }
    }
  }
  return env.NEXT_PUBLIC_API_BASE_URL;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const encoded = encodeURIComponent(name) + "=";
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(encoded)) {
      return decodeURIComponent(part.slice(encoded.length));
    }
  }
  return null;
}

async function getCsrfToken(): Promise<string | null> {
  const existing = readCookie("csrf_token");
  if (existing) return existing;

  const url = new URL("/api/v1/auth/csrf", getApiBaseUrl()).toString();
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return null;
  const data: unknown = await res.json().catch(() => null);
  if (typeof data === "object" && data && "csrfToken" in data) {
    const token = (data as { csrfToken?: unknown }).csrfToken;
    return typeof token === "string" && token.length > 0 ? token : null;
  }
  return null;
}

export async function httpClient<TResponse>(
  path: string,
  options: RequestOptions = {}
): Promise<TResponse> {
  const url = new URL(path, getApiBaseUrl()).toString();

  const method = options.method ?? "GET";
  const csrfToken =
    method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE"
      ? await getCsrfToken()
      : null;

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
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
