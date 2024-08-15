import { faker } from '@faker-js/faker';

import { DeleteUserAction, DeleteUserResponseBody } from './delete-user.action.js';

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

            const body: DeleteUserResponseBody = {
                deleteResponse: {
                    return: {
                        aliases: [],
                        email1: 'string',
                        email2: 'string',
                        email3: 'string',
                        primaryEmail: 'string',
                        mailenabled: true,

                        id: 'id',
                        given_name: 'firstname',
                        sur_name: 'lastname',
                        name: 'username',
                    },
                },
            };
            expect(action.parseBody(body)).toEqual({
                ok: true,
                value: {
                    firstname: 'firstname',
                    lastname: 'lastname',
                    username: 'username',
                    id: 'id',
                    primaryEmail: 'string',
                    mailenabled: true,
                },
            });
        });
    });
});
