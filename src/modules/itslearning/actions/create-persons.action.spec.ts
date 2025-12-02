import { faker } from '@faker-js/faker';

import { IMSESInstitutionRoleType } from '../types/role.enum.js';
import { CreatePersonsAction } from './create-persons.action.js';

describe('CreatePersonsAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: CreatePersonsAction = new CreatePersonsAction([
                {
                    id: faker.string.uuid(),
                    firstName: faker.person.firstName(),
                    lastName: faker.person.lastName(),
                    username: faker.internet.username(),
                    institutionRoleType: faker.helpers.enumValue(IMSESInstitutionRoleType),
                    email: faker.internet.email(),
                },
            ]);

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return void result', () => {
            const action: CreatePersonsAction = new CreatePersonsAction([
                {
                    id: faker.string.uuid(),
                    firstName: faker.person.firstName(),
                    lastName: faker.person.lastName(),
                    username: faker.internet.username(),
                    institutionRoleType: faker.helpers.enumValue(IMSESInstitutionRoleType),
                    email: faker.internet.email(),
                },
            ]);

            expect(action.parseBody()).toEqual({
                ok: true,
                value: undefined,
            });
        });
    });
});
