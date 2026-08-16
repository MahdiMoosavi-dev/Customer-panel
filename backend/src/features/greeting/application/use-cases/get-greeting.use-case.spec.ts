import { err, ok, UnexpectedError, type AppError, type Result } from '@/core';
import type { Greeting } from '../../domain/entities/greeting';
import type { GreetingRepository } from '../../domain/repositories/greeting.repository';
import { GetGreetingUseCase } from './get-greeting.use-case';

function fakeRepository(
  result: Result<Greeting, AppError>,
): GreetingRepository {
  return { findCurrent: () => Promise.resolve(result) };
}

describe('GetGreetingUseCase', () => {
  it('maps the entity to a DTO on success', async () => {
    const useCase = new GetGreetingUseCase(
      fakeRepository(ok({ headline: 'Hello World', message: 'Up.' })),
    );

    const result = await useCase.execute();

    expect(result).toEqual({
      ok: true,
      value: { headline: 'Hello World', message: 'Up.' },
    });
  });

  it('passes repository failures through untouched', async () => {
    const error = new UnexpectedError('boom');
    const useCase = new GetGreetingUseCase(fakeRepository(err(error)));

    const result = await useCase.execute();

    expect(result).toEqual({ ok: false, error });
  });
});
