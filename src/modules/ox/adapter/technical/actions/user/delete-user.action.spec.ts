import { faker } from '@faker-js/faker';

import { DeleteUserAction } from './delete-user.action.js';

describe('DeleteUserAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: DeleteUserAction = new DeleteUserAction({
                contextId: faker.string.uuid(),
                userId: faker.string.uuid(),
                login: '',
                password: '',
            });

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return DeleteUserResponse', () => {
            const action: DeleteUserAction = new DeleteUserAction({
                contextId: faker.string.uuid(),
                userId: faker.string.uuid(),
                login: '',
                password: '',
            });

            expect(action.parseBody()).toEqual({
                ok: true,
                value: undefined,
            });
        });
    });
});
