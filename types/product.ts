export type BazaarQuickStatus = {
  buyPrice: number;
  sellPrice: number;
  buyVolume: number;
  sellVolume: number;
  buyMovingWeek: number;
  sellMovingWeek: number;
  buyOrders: number;
  sellOrders: number;
};

export type Product = {
  date: Date;
  product_id: string;
  quick_status: BazaarQuickStatus;
};
