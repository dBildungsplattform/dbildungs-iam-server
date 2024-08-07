import { faker } from '@faker-js/faker';

import { CreateUserAction, CreateUserResponseBody } from './create-user.action.js';

describe('CreateUserAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const firstname: string = faker.person.firstName();
            const lastname: string = faker.person.lastName();
            const email: string = firstname + '.' + lastname + '@test.de';

            const action: CreateUserAction = new CreateUserAction({
                contextId: faker.string.uuid(),
                displayName: firstname,
                email1: email,
                givenname: firstname,
                mailEnabled: true,
                firstname: firstname,
                lastname: lastname,
                primaryEmail: email,
                userPassword: 'Test',
                login: '',
                password: '',
            });

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return CreateUserResponse', () => {
            const firstname: string = faker.person.firstName();
            const lastname: string = faker.person.lastName();
            const email: string = firstname + '.' + lastname + '@test.de';

            const action: CreateUserAction = new CreateUserAction({
                contextId: faker.string.uuid(),
                displayName: firstname,
                email1: email,
                givenname: firstname,
                mailEnabled: true,
                firstname: firstname,
                lastname: lastname,
                primaryEmail: email,
                userPassword: 'Test',
                login: '',
                password: '',
            });

            const cub: CreateUserResponseBody = {
                createResponse: {
                    return: {
                        'ns2:aliases': [],
                        'ns2:email1': 'string',
                        'ns2:email2': 'string',
                        'ns2:email3': 'string',
                        'ns2:primaryEmail': 'string',
                        'ns2:mailenabled': true,

                        'ns2:id': 'id',
                        'ns2:given_name': 'firstname',
                        'ns2:sur_name': 'lastname',
                        'ns2:name': 'username',
                    },
                },
            };
            expect(action.parseBody(cub)).toEqual({
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
