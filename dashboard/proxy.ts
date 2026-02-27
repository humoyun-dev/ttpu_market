import { NextResponse, type NextRequest } from "next/server";

const ROLE_COOKIE = "ttpu_role";
const STORE_COOKIE = "ttpu_store_id";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const role = request.cookies.get(ROLE_COOKIE)?.value ?? null;
  const storeId = request.cookies.get(STORE_COOKIE)?.value ?? null;

  if (pathname === "/login") {
    if (!role) return NextResponse.next();

    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "seller") {
      return NextResponse.redirect(
        new URL(
          storeId ? "/seller/dashboard" : "/seller/store/switch",
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
    if (pathname !== "/seller/store/switch" && !storeId) {
      return NextResponse.redirect(new URL("/seller/store/switch", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)",
  ],
};

