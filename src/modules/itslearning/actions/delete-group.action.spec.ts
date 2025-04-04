import { faker } from '@faker-js/faker';

import { DeleteGroupAction } from './delete-group.action.js';

describe('DeleteGroupAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: DeleteGroupAction = new DeleteGroupAction(faker.string.uuid());

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return void result', () => {
            const action: DeleteGroupAction = new DeleteGroupAction(faker.string.uuid());

            expect(action.parseBody()).toEqual({
                ok: true,
                value: undefined,
            });
        });
    });
});
