import type { Role } from "@/lib/constants/roles";
import type { components } from "@/lib/http/openapi";

export type ApiLoginInput = components["schemas"]["LoginDto"];
export type ApiAuthSession = components["schemas"]["AuthSessionDto"];
export type ApiAuthMe = components["schemas"]["AuthMeDto"];
export type ApiCsrfToken = components["schemas"]["CsrfTokenDto"];
export type ApiLogout = components["schemas"]["LogoutDto"];
export type ApiUserRole = components["schemas"]["AuthUserDto"]["role"];
export type ApiRole = ApiUserRole | ApiAuthMe["role"];

export function toDashboardRole(apiRole: unknown): Role | null {
  if (apiRole === "ADMIN") return "admin";
  if (apiRole === "SELLER") return "seller";
  return null;
}
