export interface UpdateProductDto {
  readonly title?: string;
  readonly shortDescription?: string;
  readonly longDescription?: string;
  readonly imageUrl?: string;
  readonly price?: number;
  readonly category?: string;
}
