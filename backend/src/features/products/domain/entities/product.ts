import { err, ok, ValidationError, type Result } from '@/core';

/** A persisted product. */
export interface Product {
  readonly id: string;
  readonly title: string;
  readonly shortDescription: string;
  readonly longDescription: string;
  readonly imageUrl: string;
  readonly price: number;
  readonly category: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Validated data ready to be persisted as a new product. */
export interface NewProduct {
  readonly title: string;
  readonly shortDescription: string;
  readonly longDescription: string;
  readonly imageUrl: string;
  readonly price: number;
  readonly category: string;
}

export interface NewProductInput {
  readonly title: string;
  readonly shortDescription: string;
  readonly longDescription: string;
  readonly imageUrl: string;
  readonly price: number;
  readonly category: string;
}

/**
 * Factory that enforces the entity's invariants: text fields are trimmed
 * and required, the image URL must look like a URL, and price cannot be
 * negative. Deeper URL/format validation already happens at the
 * request-DTO layer (`@IsUrl()`) — this is the last line of defense for
 * any caller that bypasses HTTP, e.g. a unit test or a future script.
 */
export function createProduct(
  input: NewProductInput,
): Result<NewProduct, ValidationError> {
  const title = input.title.trim();
  const shortDescription = input.shortDescription.trim();
  const longDescription = input.longDescription.trim();
  const imageUrl = input.imageUrl.trim();
  const category = input.category.trim();

  if (title.length === 0) {
    return err(new ValidationError('A title is required.'));
  }

  if (shortDescription.length === 0) {
    return err(new ValidationError('A short description is required.'));
  }

  if (longDescription.length === 0) {
    return err(new ValidationError('A long description is required.'));
  }

  if (imageUrl.length === 0) {
    return err(new ValidationError('An image URL is required.'));
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    return err(new ValidationError('Price must be a non-negative number.'));
  }

  if (category.length === 0) {
    return err(new ValidationError('A category is required.'));
  }

  return ok({
    title,
    shortDescription,
    longDescription,
    imageUrl,
    price: input.price,
    category,
  });
}
