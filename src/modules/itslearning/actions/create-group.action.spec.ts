import { faker } from '@faker-js/faker';
import { CreateGroupAction } from './create-group.action.js';

describe('CreateGroupAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: CreateGroupAction = new CreateGroupAction({
                id: faker.string.uuid(),
                name: `${faker.word.adjective()} school`,
                parentId: faker.string.uuid(),
                type: 'School',
            });

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should void result', () => {
            const action: CreateGroupAction = new CreateGroupAction({
                id: faker.string.uuid(),
                name: `${faker.word.adjective()} school`,
                parentId: faker.string.uuid(),
                type: 'School',
            });

            expect(action.parseBody()).toEqual({
                ok: true,
                value: undefined,
            });
        });
    });
});
