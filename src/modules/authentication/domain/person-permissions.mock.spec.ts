import { PersonPermissionsMock } from './person-permissions.mock.js';

describe('PersonPermissionsMock', () => {
    const sut: PersonPermissionsMock = new PersonPermissionsMock();

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
