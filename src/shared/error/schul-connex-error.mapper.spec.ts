import { HttpException } from '@nestjs/common';
import { DomainError } from './domain.error.js';
import { EntityNotFoundError } from './entity-not-found.error.js';
import { SchulConnexErrorMapper } from './schul-connex-error.mapper.js';
import { SchulConnexError } from './schul-connex.error.js';

describe('DomainToSchulConnexErrorMapper', () => {
    describe('mapSchulConnexErrorToHttpExcetion', () => {
        describe('when mapping SchulconnexError', () => {
            it('should return HttpException', () => {
                const result: HttpException = SchulConnexErrorMapper.mapSchulConnexErrorToHttpExcetion(
                    {} as SchulConnexError,
                );

                expect(result).toBeInstanceOf(HttpException);
            });
        });
    });
    describe('mapDomainErrorToSchulConnexError', () => {
        describe('when mapping a known DomainError', () => {
            it('should return SchulConnexError', () => {
                const domainError: EntityNotFoundError = new EntityNotFoundError('Person');
                const result: SchulConnexError = SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(domainError);

                expect(result).toBeInstanceOf(SchulConnexError);
                expect(result.code).toBe(404);
            });
        });

        describe('when mapping unknown DomainError', () => {
            it('should return SchulConnexError', () => {
                class UnknownError extends DomainError {
                    public constructor() {
                        super('', '');
                    }
                }

                const domainError: DomainError = new UnknownError();
                const result: SchulConnexError = SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(domainError);

                expect(result).toBeInstanceOf(SchulConnexError);
                expect(result.code).toBe(500);
            });
        });
    });
});
