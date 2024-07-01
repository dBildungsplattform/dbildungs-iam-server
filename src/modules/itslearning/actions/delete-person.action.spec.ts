import { faker } from '@faker-js/faker';

import { DeletePersonAction } from './delete-person.action.js';

describe('DeletePersonAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: DeletePersonAction = new DeletePersonAction(faker.string.uuid());

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return void result', () => {
            const action: DeletePersonAction = new DeletePersonAction(faker.string.uuid());

            expect(action.parseBody()).toEqual({
                ok: true,
                value: undefined,
            });
        });
    });
});
