import type { BazaarQuickStatus } from "./product";

export type HypixelBazaarProduct = {
  product_id: string;
  quick_status: BazaarQuickStatus;
};

export type BazaarApiResponse = {
  success: boolean;
  lastUpdated: number;
  products: Record<string, HypixelBazaarProduct>;
};
