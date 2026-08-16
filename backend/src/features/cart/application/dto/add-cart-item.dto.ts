export interface AddCartItemDto {
  readonly productId: string;
  /** Defaults to 1 when omitted. */
  readonly quantity?: number;
}
