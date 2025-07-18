import { faker } from '@faker-js/faker';

import { DeletePersonsAction } from './delete-persons.action.js';

describe('DeletePersonsAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: DeletePersonsAction = new DeletePersonsAction([faker.string.uuid()]);

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return void result', () => {
            const action: DeletePersonsAction = new DeletePersonsAction([faker.string.uuid()]);

            expect(action.parseBody()).toEqual({
                ok: true,
                value: undefined,
            });
        });
    });
});
