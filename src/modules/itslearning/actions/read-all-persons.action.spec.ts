import { faker } from '@faker-js/faker';
import { ReadAllPersonsAction } from './read-all-persons.action.js';

describe('ReadAllPersonsAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: ReadAllPersonsAction = new ReadAllPersonsAction({
                pageIndex: 1,
                pageSize: 10,
            });

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('isArrayOverride', () => {
        it('should return true for specific tags', () => {
            const action: ReadAllPersonsAction = new ReadAllPersonsAction({
                pageIndex: 1,
                pageSize: 10,
            });

            expect(action.isArrayOverride('personIdPair')).toBe(true);
            expect(action.isArrayOverride('partName')).toBe(true);
            expect(action.isArrayOverride('tel')).toBe(true);
        });
    });

    describe('parseBody', () => {
        it('should void result', () => {
            const action: ReadAllPersonsAction = new ReadAllPersonsAction({
                pageIndex: 1,
                pageSize: 10,
            });
            const personId: string = faker.string.uuid();
            const userId: string = faker.internet.userName();

            expect(
                action.parseBody({
                    readAllPersonsResponse: {
                        virtualCount: 1,
                        personIdPairSet: {
                            personIdPair: [
                                {
                                    sourceId: { identifier: personId },
                                    person: {
                                        userId: {
                                            userIdValue: userId,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                }),
            ).toEqual({
                ok: true,
                value: [
                    {
                        id: personId,
                    },
                ],
            });
        });
    });
});
