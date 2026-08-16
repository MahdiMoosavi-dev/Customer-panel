/** A cart line item enriched with the product details the client needs to render it. */
export interface CartItemDto {
  readonly productId: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly imageUrl: string;
  readonly price: number;
  readonly quantity: number;
  readonly addedAt: string;
}
