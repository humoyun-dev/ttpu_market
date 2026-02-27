import type { Role } from "@/lib/constants/roles";
import type { AuthSession, LoginInput } from "@/features/auth/auth.types";

const ROLE_COOKIE = "ttpu_role";
const STORE_COOKIE = "ttpu_store_id";

function setCookie(name: string, value: string) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; Path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function mockLogin(input: LoginInput): AuthSession {
  setCookie(ROLE_COOKIE, input.role);
  if (input.role === "admin") {
    deleteCookie(STORE_COOKIE);
  }

  return mockGetMe(input.role);
}

export function mockLogout() {
  deleteCookie(ROLE_COOKIE);
  deleteCookie(STORE_COOKIE);
}

export function mockGetMe(role: Role): AuthSession {
  if (role === "admin") {
    return {
      user: {
        id: "admin",
        email: "admin@example.com",
        role: "admin",
        storeIds: [],
      },
      activeStoreId: null,
    };
  }

  return {
    user: {
      id: "seller",
      email: "seller@example.com",
      role: "seller",
      storeIds: ["store_1", "store_2"],
    },
    activeStoreId: null,
  };
}

export const mockCookies = {
  ROLE_COOKIE,
  STORE_COOKIE,
};

