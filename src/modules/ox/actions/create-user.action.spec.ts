import { faker } from '@faker-js/faker';

import { CreateUserAction } from './create-user.action.js';

describe('CreateUserAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: CreateUserAction = new CreateUserAction({
                contextId: faker.string.uuid(),
                anniversary: faker.date.past().toISOString(),
                email1: faker.internet.email(),
                givenname: faker.person.firstName(),
                mailenabled: true,
                name: faker.internet.userName(),
                login: '',
                password: '',
            });

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return void result', () => {
            const action: CreateUserAction = new CreateUserAction({
                contextId: faker.string.uuid(),
                anniversary: faker.date.past().toISOString(),
                email1: faker.internet.email(),
                givenname: faker.person.firstName(),
                mailenabled: true,
                name: faker.internet.userName(),
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
