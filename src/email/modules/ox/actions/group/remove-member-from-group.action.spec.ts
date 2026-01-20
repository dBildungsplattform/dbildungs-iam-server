import { faker } from '@faker-js/faker';
import { RemoveMemberFromGroupAction } from './remove-member-from-group.action.js';

describe('RemoveMemberFromGroupAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: RemoveMemberFromGroupAction = new RemoveMemberFromGroupAction({
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
        it('should return RemoveMemberFromGroupResponse', () => {
            const action: RemoveMemberFromGroupAction = new RemoveMemberFromGroupAction({
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
