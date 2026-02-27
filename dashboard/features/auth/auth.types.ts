import type { Role } from "@/lib/constants/roles";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  storeIds: string[];
};

export type AuthSession = {
  user: AuthUser;
  activeStoreId: string | null;
};

export type LoginInput = {
  role: Role;
  email: string;
  password: string;
};

