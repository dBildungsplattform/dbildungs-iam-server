import { faker } from '@faker-js/faker';

import { GetDataForUserAction, GetDataForUserResponseBody } from './get-data-user.action.js';

describe('GetDataForUserAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: GetDataForUserAction = new GetDataForUserAction({
                contextId: faker.string.uuid(),
                userName: faker.internet.userName(),
                login: '',
                password: '',
            });

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return GetDataForUserResponse', () => {
            const action: GetDataForUserAction = new GetDataForUserAction({
                contextId: faker.string.uuid(),
                userName: faker.internet.userName(),
                login: '',
                password: '',
            });

            const body: GetDataForUserResponseBody = {
                getDataResponse: {
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
