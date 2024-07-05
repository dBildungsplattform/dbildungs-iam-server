import { faker } from '@faker-js/faker';

import { ItsLearningRoleType } from '../types/role.enum.js';
import { CreatePersonAction } from './create-person.action.js';

describe('CreatePersonAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: CreatePersonAction = new CreatePersonAction({
                id: faker.string.uuid(),
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                username: faker.internet.userName(),
                institutionRoleType: faker.helpers.enumValue(ItsLearningRoleType),
            });

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return void result', () => {
            const action: CreatePersonAction = new CreatePersonAction({
                id: faker.string.uuid(),
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                username: faker.internet.userName(),
                institutionRoleType: faker.helpers.enumValue(ItsLearningRoleType),
            });

            expect(action.parseBody()).toEqual({
                ok: true,
                value: undefined,
            });
        });
    });
});
