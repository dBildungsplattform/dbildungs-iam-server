import { faker } from '@faker-js/faker';

import { DeleteMembershipsAction } from './delete-memberships.action.js';

describe('DeleteMembershipsAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: DeleteMembershipsAction = new DeleteMembershipsAction([faker.string.uuid()]);

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return void result', () => {
            const action: DeleteMembershipsAction = new DeleteMembershipsAction([faker.string.uuid()]);

            expect(action.parseBody()).toEqual({
                ok: true,
                value: undefined,
            });
        });
    });
});
