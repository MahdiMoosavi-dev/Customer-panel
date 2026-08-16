import { HttpException, HttpStatus } from '@nestjs/common';
import type { AppError } from '@/core';

const STATUS_BY_CODE: Record<string, HttpStatus> = {
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  UNEXPECTED_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
};

/** Translates a domain error into the transport layer's vocabulary. */
export function toHttpException(error: AppError): HttpException {
  const status = STATUS_BY_CODE[error.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

  return new HttpException(
    { statusCode: status, code: error.code, message: error.message },
    status,
    { cause: error },
  );
}
