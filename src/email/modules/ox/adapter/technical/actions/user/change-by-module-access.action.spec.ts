import { faker } from '@faker-js/faker';
import { ChangeByModuleAccessAction } from './change-by-module-access.action.js';

describe('ChangeByModuleAccessAction', () => {
    describe('buildRequest', () => {
        it('should return object', () => {
            const oxUserId: string = faker.string.numeric();
            const action: ChangeByModuleAccessAction = new ChangeByModuleAccessAction({
                contextId: faker.string.uuid(),
                userId: oxUserId,
                globalAddressBookDisabled: true,
                infostore: true,
                login: '',
                password: '',
            });

            expect(action.buildRequest()).toBeDefined();
        });
    });

    describe('parseBody', () => {
        it('should return void', () => {
            const oxUserId: string = faker.string.numeric();
            const action: ChangeByModuleAccessAction = new ChangeByModuleAccessAction({
                contextId: faker.string.uuid(),
                userId: oxUserId,
                globalAddressBookDisabled: true,
                infostore: true,
                login: '',
                password: '',
            });

            expect(action.parseBody()).toEqual({
                ok: true,
                value: undefined,
            });
        });
    });
});
