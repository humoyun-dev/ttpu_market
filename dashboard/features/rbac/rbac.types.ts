import type { Role } from "@/lib/constants/roles";

export type RbacContext = {
  role: Role;
  storeId: string | null;
};

