/** A persisted cart line item — one row per (user, product) pair. */
export interface CartItem {
  readonly id: string;
  readonly userId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
