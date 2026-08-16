/** Serializable shape returned to callers. */
export interface ProductDto {
  readonly id: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly longDescription: string;
  readonly imageUrl: string;
  readonly price: number;
  readonly category: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
