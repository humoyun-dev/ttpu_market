import { NextResponse, type NextRequest } from "next/server";

import type { ApiAuthMe } from "@/features/auth/auth.types";
import { toDashboardRole } from "@/features/auth/auth.types";
import { httpClient } from "@/lib/http/client";
import type { Role } from "@/lib/constants/roles";

const STORE_COOKIE = "ttpu_store_id";

async function getMeFromBackend(request: NextRequest): Promise<ApiAuthMe | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (!cookieHeader) return null;

  try {
    const session = await httpClient<ApiAuthMe>("/api/v1/auth/me", {
      headers: { cookie: cookieHeader },
    });
    return session.isActive ? session : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const storeIdFromCookie = request.cookies.get(STORE_COOKIE)?.value ?? null;
  const me = await getMeFromBackend(request);
  const role: Role | null = me ? toDashboardRole(me.role) : null;
  const storeId =
    role === "seller" &&
    me?.stores?.some((s) => s.id === storeIdFromCookie && s.status === "ACTIVE")
      ? storeIdFromCookie
      : null;

  if (pathname === "/login") {
    if (!role) return NextResponse.next();

    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "seller") {
      return NextResponse.redirect(
        new URL(
          storeId ? "/seller/dashboard" : "/seller/stores",
          request.url
        )
      );
    }
  }

  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/seller")) {
    if (role !== "seller") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const isStoreSelectionRoute =
      pathname === "/seller/stores" ||
      pathname.startsWith("/seller/stores/") ||
      pathname === "/seller/store/switch";
    if (!isStoreSelectionRoute && !storeId) {
      return NextResponse.redirect(new URL("/seller/stores", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)",
  ],
};
