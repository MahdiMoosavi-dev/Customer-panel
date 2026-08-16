import { Injectable } from '@nestjs/common';
import { Prisma, type CartItem as PrismaCartItem } from '@prisma/client';
import {
  err,
  NotFoundError,
  ok,
  UnexpectedError,
  type AppError,
  type Result,
} from '@/core';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { CartItem } from '../../domain/entities/cart-item';
import type { CartRepository } from '../../domain/repositories/cart.repository';

function isKnownRequestError(
  cause: unknown,
  code: string,
): cause is Prisma.PrismaClientKnownRequestError {
  return (
    cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === code
  );
}

function toCartItem(record: PrismaCartItem): CartItem {
  return {
    id: record.id,
    userId: record.userId,
    productId: record.productId,
    quantity: record.quantity,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@Injectable()
export class PrismaCartRepository implements CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string): Promise<Result<CartItem[], AppError>> {
    try {
      const records = await this.prisma.cartItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      return ok(records.map(toCartItem));
    } catch (cause) {
      return err(new UnexpectedError('Could not load the cart.', { cause }));
    }
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<Result<CartItem, AppError>> {
    try {
      const record = await this.prisma.cartItem.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId, quantity },
        update: { quantity: { increment: quantity } },
      });
      return ok(toCartItem(record));
    } catch (cause) {
      if (isKnownRequestError(cause, 'P2003')) {
        return err(new NotFoundError('Product not found.', { cause }));
      }
      return err(
        new UnexpectedError('Could not add the product to the cart.', {
          cause,
        }),
      );
    }
  }

  async removeItem(
    userId: string,
    productId: string,
  ): Promise<Result<void, AppError>> {
    try {
      await this.prisma.cartItem.delete({
        where: { userId_productId: { userId, productId } },
      });
      return ok(undefined);
    } catch (cause) {
      if (isKnownRequestError(cause, 'P2025')) {
        return err(new NotFoundError('Product not found in cart.', { cause }));
      }
      return err(
        new UnexpectedError('Could not remove the product from the cart.', {
          cause,
        }),
      );
    }
  }
}
