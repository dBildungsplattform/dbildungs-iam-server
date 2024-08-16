import { faker } from '@faker-js/faker';
import { UpdateGroupAction } from './update-group.action.js';

describe('UpdateGroupAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: UpdateGroupAction = new UpdateGroupAction({
                id: faker.string.uuid(),
                name: `${faker.word.adjective()} school`,
                parentId: faker.string.uuid(),
                type: 'School',
            });

            expect(action.buildRequest()).toBeDefined();
        });

        it('should return include extension data', () => {
            const name: string = `${faker.word.adjective()} course`;
            const action: UpdateGroupAction = new UpdateGroupAction({
                id: faker.string.uuid(),
                name: name,
                parentId: faker.string.uuid(),
                type: 'Course',
            });

            expect(action.buildRequest()).toMatchObject({
                'ims:updateGroupRequest': {
                    'ims:group': {
                        'ims2:extension': {
                            'ims1:extensionField': [
                                {
                                    'ims1:fieldName': 'course',
                                    'ims1:fieldType': 'String',
                                    'ims1:fieldValue': name,
                                },
                                {
                                    'ims1:fieldName': 'course/code',
                                    'ims1:fieldType': 'String',
                                    'ims1:fieldValue': name,
                                },
                            ],
                        },
                    },
                },
            });
        });
    });

    describe('parseBody', () => {
        it('should void result', () => {
            const action: UpdateGroupAction = new UpdateGroupAction({
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
