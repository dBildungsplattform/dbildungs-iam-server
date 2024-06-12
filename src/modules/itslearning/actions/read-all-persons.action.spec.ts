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
        it('should return true for tag "personIdPair"', () => {
            const action: ReadAllPersonsAction = new ReadAllPersonsAction({
                pageIndex: 1,
                pageSize: 10,
            });

            expect(action.isArrayOverride('personIdPair')).toBe(true);
        });

        it('should return true for tag "partName"', () => {
            const action: ReadAllPersonsAction = new ReadAllPersonsAction({
                pageIndex: 1,
                pageSize: 10,
            });

            expect(action.isArrayOverride('partName')).toBe(true);
        });

        it('should return true for tag "tel"', () => {
            const action: ReadAllPersonsAction = new ReadAllPersonsAction({
                pageIndex: 1,
                pageSize: 10,
            });

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
