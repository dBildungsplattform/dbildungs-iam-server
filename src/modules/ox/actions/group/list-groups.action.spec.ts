import { faker } from '@faker-js/faker';
import { ListGroupsAction } from './list-groups.action.js';
import { ListAllGroupsResponseBody } from './list-all-groups.action.js';

describe('ListGroupsAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: ListGroupsAction = new ListGroupsAction({
                contextId: faker.string.uuid(),
                pattern: faker.string.alphanumeric(),
                login: '',
                password: '',
            });

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return ListGroupsResponse', () => {
            const action: ListGroupsAction = new ListGroupsAction({
                contextId: faker.string.uuid(),
                pattern: faker.string.alphanumeric(),
                login: '',
                password: '',
            });

            const body: ListAllGroupsResponseBody = {
                listAllResponse: {
                    return: [
                        {
                            id: 'id1',
                            displayname: 'display name group 1',
                            name: 'group1',
                            memberIds: ['userId1'],
                        },
                        {
                            id: 'id2',
                            displayname: 'display name group 2',
                            name: 'group2',
                            memberIds: ['userId1'],
                        },
                    ],
                },
            };
            expect(action.parseBody(body)).toEqual({
                ok: true,
                value: {
                    groups: [
                        {
                            id: 'id1',
                            displayname: 'display name group 1',
                            name: 'group1',
                            memberIds: ['userId1'],
                        },
                        {
                            id: 'id2',
                            displayname: 'display name group 2',
                            name: 'group2',
                            memberIds: ['userId1'],
                        },
                    ],
                },
            });
        });
    });
});
