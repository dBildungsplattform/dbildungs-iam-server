import { faker } from '@faker-js/faker';
import { CreateMembershipsAction } from './create-memberships.action.js';
import { IMSESRoleType } from '../types/role.enum.js';

describe('CreateMembershipsAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: CreateMembershipsAction = new CreateMembershipsAction([
                {
                    id: faker.string.uuid(),
                    personId: faker.string.uuid(),
                    groupId: faker.string.uuid(),
                    roleType: faker.helpers.enumValue(IMSESRoleType),
                },
            ]);

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should void result', () => {
            const action: CreateMembershipsAction = new CreateMembershipsAction([
                {
                    id: faker.string.uuid(),
                    personId: faker.string.uuid(),
                    groupId: faker.string.uuid(),
                    roleType: faker.helpers.enumValue(IMSESRoleType),
                },
            ]);

            expect(action.parseBody()).toEqual({
                ok: true,
                value: undefined,
            });
        });
    });
});
