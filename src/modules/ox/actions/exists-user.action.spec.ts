import { faker } from '@faker-js/faker';
import { ExistsUserAction, ExistsUserResponseBody } from './exists-user.action.js';

describe('ExistsUserAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const username: string = faker.internet.userName();

            const action: ExistsUserAction = new ExistsUserAction({
                contextId: faker.string.uuid(),
                username: username,
                login: '',
                password: '',
            });

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return ExistsUserResponse', () => {
            const username: string = faker.internet.userName();

            const action: ExistsUserAction = new ExistsUserAction({
                contextId: faker.string.uuid(),
                username: username,
                login: '',
                password: '',
            });

            const cub: ExistsUserResponseBody = {
                existsResponse: {
                    return: true,
                },
            };
            expect(action.parseBody(cub)).toEqual({
                ok: true,
                value: {
                    exists: true,
                },
            });
        });
    });
});
