import { faker } from '@faker-js/faker';

import { Either, Err, Ok, UnionToResult } from './result.js';

describe('Result', () => {
    describe('Ok', () => {
        it('should return an okay-result', () => {
            const value: string = faker.string.alphanumeric(16);

            const res: Result<string, unknown> = Ok(value);

            expect(res).toEqual({
                ok: true,
                value,
            });
        });
    });

    describe('Err', () => {
        it('should return an error-result', () => {
            const error: Error = new Error(faker.string.alphanumeric(16));

            const res: Result<unknown, Error> = Err(error);

            expect(res).toEqual({
                ok: false,
                error,
            });
        });
    });

    describe('Either', () => {
        it('should return an okay-result when okay is true', () => {
            const value: string = faker.string.alphanumeric(16);

            const res: Result<string, unknown> = Either(true, value, undefined);

            expect(res).toEqual({
                ok: true,
                value,
            });
        });

        it('should return an error-result when okay is false', () => {
            const error: Error = new Error(faker.string.alphanumeric(16));

            const res: Result<unknown, Error> = Either(false, undefined, error);

            expect(res).toEqual({
                ok: false,
                error,
            });
        });
    });

    describe('UnionToResult', () => {
        it('should return an okay-result when the union is not an error', () => {
            const union: string | Error = faker.string.alphanumeric(16) as string | Error;

            const res: Result<string, Error> = UnionToResult(union);

            expect(res).toEqual({
                ok: true,
                value: union,
            });
        });

        it('should return an error-result when the union is an error', () => {
            const union: string | Error = new Error(faker.string.alphanumeric(16)) as string | Error;

            const res: Result<string, Error> = UnionToResult(union);

            expect(res).toEqual({
                ok: false,
                error: union,
            });
        });
    });
});
