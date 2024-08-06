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
                anniversary: faker.date.past().toISOString(),
                displayName: firstname,
                email1: email,
                givenName: firstname,
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
        it('should return void result', () => {
            const firstname: string = faker.person.firstName();
            const lastname: string = faker.person.lastName();
            const email: string = firstname + '.' + lastname + '@test.de';

            const action: CreateUserAction = new CreateUserAction({
                contextId: faker.string.uuid(),
                anniversary: faker.date.past().toISOString(),
                displayName: firstname,
                email1: email,
                givenName: firstname,
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

                        'ns2:name': 'string',
                        'ns2:sur_name': 'string',
                        'ns2:mailenabled': true,
                    },
                },
            };
            expect(action.parseBody(cub)).toEqual({
                ok: true,
                value: {
                    firstname: 'string',
                    lastname: 'string',
                    primaryEmail: 'string',
                    mailenabled: true,
                },
            });
        });
    });
});
