import { faker } from '@faker-js/faker';
import { ReadPersonAction } from './read-person.action.js';
import { ItsLearningRoleType } from '../types/role.enum.js';

describe('ReadPersonAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const action: ReadPersonAction = new ReadPersonAction(faker.string.uuid());

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('isArrayOverride', () => {
        it("should return true for 'partName'", () => {
            const action: ReadPersonAction = new ReadPersonAction(faker.string.uuid());

            expect(action.isArrayOverride('partName')).toBe(true);
        });
    });

    describe('parseBody', () => {
        it('should return result', () => {
            const userId: string = faker.string.uuid();
            const firstName: string = faker.person.firstName();
            const lastName: string = faker.person.lastName();
            const email: string = faker.internet.email();
            const institutionRole: ItsLearningRoleType = faker.helpers.enumValue(ItsLearningRoleType);
            const primaryRoleType: boolean = faker.datatype.boolean();
            const action: ReadPersonAction = new ReadPersonAction(userId);

            expect(
                action.parseBody({
                    readPersonResponse: {
                        person: {
                            name: {
                                partName: [
                                    { namePartType: 'first', namePartValue: firstName },
                                    { namePartType: 'last', namePartValue: lastName },
                                ],
                            },
                            email,
                            userId: {
                                userIdValue: userId,
                            },
                            institutionRole: {
                                institutionRoleType: institutionRole,
                                primaryRoleType,
                            },
                        },
                    },
                }),
            ).toEqual({
                ok: true,
                value: {
                    institutionRole,
                    primaryRoleType,
                    userId,
                },
            });
        });
    });
});
