import { EntityNotFoundError } from './entity-not-found.error.js';
import { faker } from '@faker-js/faker';

describe('EntityNotFoundError', () => {
    describe('constructor', () => {
        describe('when calling the constructor', () => {
            it('should set message and code', () => {
                const id: string = faker.string.numeric();
                const error: EntityNotFoundError = new EntityNotFoundError('EntityName', id);
                expect(error.message).toBe(`requested EntityName with the following ID ${id} was not found`);
                expect(error.code).toBe('ENTITY_NOT_FOUND');
            });
        });
    });
});
