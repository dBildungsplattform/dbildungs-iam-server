import { faker } from '@faker-js/faker';

import { AddMemberToGroupAction } from './add-member-to-group.action.js';

describe('AddMemberToGroupAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: AddMemberToGroupAction = new AddMemberToGroupAction({
                contextId: faker.string.uuid(),
                groupId: faker.string.uuid(),
                memberId: faker.string.uuid(),
                login: '',
                password: '',
            });

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return AddMemberToGroupResponse', () => {
            const action: AddMemberToGroupAction = new AddMemberToGroupAction({
                contextId: faker.string.uuid(),
                groupId: faker.string.uuid(),
                memberId: faker.string.uuid(),
                login: '',
                password: '',
            });

            const body: unknown = {};
            expect(action.parseBody(body)).toEqual({
                ok: true,
                value: {
                    status: {
                        code: 'success',
                    },
                    data: body,
                },
            });
        });
    });
});
