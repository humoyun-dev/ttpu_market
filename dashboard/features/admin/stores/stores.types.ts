export type AdminStore = {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  telegramConnected: boolean;
  createdAt: string;
};

