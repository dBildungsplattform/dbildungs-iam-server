import { DomainError } from './domain.error.js';

export class MappingError extends DomainError {
    public constructor(error: unknown) {
        super((error as Error).toString(), 'MAPPING_ERROR');
    }
}

export const mappingErrorHandler = {
    handle: (error: unknown): void => {
        throw new MappingError(error);
    },
};
