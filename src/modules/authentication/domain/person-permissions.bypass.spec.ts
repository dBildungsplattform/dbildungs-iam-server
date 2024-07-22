import { PersonPermissionsBypass } from './person-permissions.bypass.js';

describe('PersonPermissionsMock', () => {
    const sut: PersonPermissionsBypass = new PersonPermissionsBypass();

    describe('hasSystemrechteAtOrganisation', () => {
        it('should return true', async () => {
            await expect(sut.hasSystemrechteAtOrganisation()).resolves.toBe(true);
        });
    });

    describe('hasSystemrechtAtOrganisation', () => {
        it('should return true', async () => {
            await expect(sut.hasSystemrechtAtOrganisation()).resolves.toBe(true);
        });
    });

    describe('canModifyPerson', () => {
        it('should return true', async () => {
            await expect(sut.canModifyPerson()).resolves.toBe(true);
        });
    });
});
