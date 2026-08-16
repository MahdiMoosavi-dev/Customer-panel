import { Injectable } from '@nestjs/common';
import { Prisma, type Product as PrismaProduct } from '@prisma/client';
import {
  err,
  NotFoundError,
  ok,
  UnexpectedError,
  type AppError,
  type Paginated,
  type Result,
} from '@/core';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { NewProduct, Product } from '../../domain/entities/product';
import type {
  ProductChanges,
  ProductListQuery,
  ProductRepository,
} from '../../domain/repositories/product.repository';

function isKnownRequestError(
  cause: unknown,
  code: string,
): cause is Prisma.PrismaClientKnownRequestError {
  return (
    cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === code
  );
}

function toProduct(record: PrismaProduct): Product {
  return {
    id: record.id,
    title: record.title,
    shortDescription: record.shortDescription,
    longDescription: record.longDescription,
    imageUrl: record.imageUrl,
    price: record.price,
    category: record.category,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(product: NewProduct): Promise<Result<Product, AppError>> {
    try {
      const record = await this.prisma.product.create({ data: product });
      return ok(toProduct(record));
    } catch (cause) {
      return err(
        new UnexpectedError('Could not create the product.', { cause }),
      );
    }
  }

  async findAll(
    query: ProductListQuery,
  ): Promise<Result<Paginated<Product>, AppError>> {
    try {
      const where: Prisma.ProductWhereInput | undefined = query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : undefined;

      const [records, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          orderBy: { [query.sortBy]: query.sortOrder },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        this.prisma.product.count({ where }),
      ]);

      return ok({
        items: records.map(toProduct),
        total,
        page: query.page,
        pageSize: query.pageSize,
      });
    } catch (cause) {
      return err(new UnexpectedError('Could not list products.', { cause }));
    }
  }

  async findById(id: string): Promise<Result<Product, AppError>> {
    try {
      const record = await this.prisma.product.findUnique({ where: { id } });
      return record
        ? ok(toProduct(record))
        : err(new NotFoundError('Product not found.'));
    } catch (cause) {
      return err(new UnexpectedError('Could not load the product.', { cause }));
    }
  }

  async findByIds(ids: string[]): Promise<Result<Product[], AppError>> {
    try {
      const records = await this.prisma.product.findMany({
        where: { id: { in: ids } },
      });
      return ok(records.map(toProduct));
    } catch (cause) {
      return err(
        new UnexpectedError('Could not load the products.', { cause }),
      );
    }
  }

  async update(
    id: string,
    changes: ProductChanges,
  ): Promise<Result<Product, AppError>> {
    try {
      const record = await this.prisma.product.update({
        where: { id },
        data: changes,
      });
      return ok(toProduct(record));
    } catch (cause) {
      if (isKnownRequestError(cause, 'P2025')) {
        return err(new NotFoundError('Product not found.', { cause }));
      }
      return err(
        new UnexpectedError('Could not update the product.', { cause }),
      );
    }
  }

  async remove(id: string): Promise<Result<void, AppError>> {
    try {
      await this.prisma.product.delete({ where: { id } });
      return ok(undefined);
    } catch (cause) {
      if (isKnownRequestError(cause, 'P2025')) {
        return err(new NotFoundError('Product not found.', { cause }));
      }
      return err(
        new UnexpectedError('Could not delete the product.', { cause }),
      );
    }
  }
}
