import { faker } from '@faker-js/faker';
import { ReadGroupAction } from './read-group.action.js';

describe('ReadGroupAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: ReadGroupAction = new ReadGroupAction(faker.string.uuid());

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return result', () => {
            const action: ReadGroupAction = new ReadGroupAction(faker.string.uuid());
            const name: string = faker.word.noun();
            const type: string = faker.word.noun();
            const parentId: string = faker.string.uuid();

            expect(
                action.parseBody({
                    readGroupResponse: {
                        group: {
                            description: { descShort: name },
                            groupType: {
                                scheme: '',
                                typeValue: { level: 1, type },
                            },
                            relationship: {
                                label: faker.word.noun(),
                                relation: 'parent',
                                sourceId: { identifier: parentId },
                            },
                        },
                    },
                }),
            ).toEqual({
                ok: true,
                value: {
                    name,
                    type,
                    parentId,
                },
            });
        });
    });
});
