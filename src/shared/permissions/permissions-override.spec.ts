import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { PersonPermissions } from '../../modules/authentication/domain/person-permissions.js';
import { RollenSystemRecht } from '../../modules/rolle/domain/systemrecht.js';
import { OrganisationID, PersonID } from '../types/index.js';
import { PermissionsOverride } from './permissions-override.js';

describe('PermissionsOverride', () => {
    describe('canModifyPerson', () => {
        describe('when the person is granted permission', () => {
            it('should return true', async () => {
                const permissionsMock: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                const personId: PersonID = faker.string.uuid();

                const canModify: boolean = await new PermissionsOverride(permissionsMock)
                    .grantPersonModifyPermission(personId)
                    .canModifyPerson(personId);

                expect(canModify).toBe(true);
            });

            it('should not call underlying permissions', async () => {
                const permissionsMock: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                const personId: PersonID = faker.string.uuid();

                await new PermissionsOverride(permissionsMock)
                    .grantPersonModifyPermission(personId)
                    .canModifyPerson(personId);

                expect(permissionsMock.canModifyPerson).not.toHaveBeenCalled();
            });
        });

        describe('when the person is not explicitly granted permission', () => {
            it('should use underlying permissions, when no person is overridden', async () => {
                const permissionsMock: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                const personId: PersonID = faker.string.uuid();

                await new PermissionsOverride(permissionsMock).canModifyPerson(personId);

                expect(permissionsMock.canModifyPerson).toHaveBeenCalledWith(personId);
            });
        });
    });

    describe('hasSystemrechteAtOrganisation', () => {
        describe('when no rechte are granted', () => {
            it('should use underlying permissions', async () => {
                const permissionsMock: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                const orgaID: OrganisationID = faker.string.uuid();
                const rechte: RollenSystemRecht[] = [
                    RollenSystemRecht.PERSONEN_VERWALTEN,
                    RollenSystemRecht.ROLLEN_VERWALTEN,
                ];

                await new PermissionsOverride(permissionsMock).hasSystemrechteAtOrganisation(orgaID, rechte);

                expect(permissionsMock.hasSystemrechteAtOrganisation).toHaveBeenCalledWith(orgaID, rechte);
            });
        });

        describe('when rechte are explicitly granted', () => {
            it('should not call underlying permissions, if every systemrecht is granted', async () => {
                const permissionsMock: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                const orgaId: OrganisationID = faker.string.uuid();

                const canModify: boolean = await new PermissionsOverride(permissionsMock)
                    .grantSystemrechteAtOrga(orgaId, [
                        RollenSystemRecht.PERSONEN_VERWALTEN,
                        RollenSystemRecht.ROLLEN_VERWALTEN,
                    ])
                    .hasSystemrechteAtOrganisation(orgaId, [
                        RollenSystemRecht.ROLLEN_VERWALTEN,
                        RollenSystemRecht.PERSONEN_VERWALTEN,
                    ]);

                expect(canModify).toBe(true);
                expect(permissionsMock.canModifyPerson).not.toHaveBeenCalled();
            });

            it('should not call underlying permissions, if all rechte were granted in multiple steps', async () => {
                const permissionsMock: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                const orgaId: OrganisationID = faker.string.uuid();

                const canModify: boolean = await new PermissionsOverride(permissionsMock)
                    .grantSystemrechteAtOrga(orgaId, [RollenSystemRecht.ROLLEN_VERWALTEN])
                    .grantSystemrechteAtOrga(orgaId, [RollenSystemRecht.PERSONEN_VERWALTEN])
                    .hasSystemrechteAtOrganisation(orgaId, [
                        RollenSystemRecht.ROLLEN_VERWALTEN,
                        RollenSystemRecht.PERSONEN_VERWALTEN,
                    ]);

                expect(canModify).toBe(true);
                expect(permissionsMock.canModifyPerson).not.toHaveBeenCalled();
            });

            it('should use underlying permissions to check remaining systemrechte', async () => {
                const permissionsMock: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                const orgaID: OrganisationID = faker.string.uuid();
                const rechte: RollenSystemRecht[] = [
                    RollenSystemRecht.PERSONEN_VERWALTEN,
                    RollenSystemRecht.ROLLEN_VERWALTEN,
                ];

                await new PermissionsOverride(permissionsMock)
                    .grantSystemrechteAtOrga(orgaID, [RollenSystemRecht.ROLLEN_VERWALTEN])
                    .hasSystemrechteAtOrganisation(orgaID, rechte);

                expect(permissionsMock.hasSystemrechteAtOrganisation).toHaveBeenCalledWith(orgaID, [
                    RollenSystemRecht.PERSONEN_VERWALTEN,
                ]);
            });
        });
    });

    describe('hasSystemrechtAtOrganisation', () => {
        describe('when no rechte are overridden', () => {
            it('should call the underlying permissions', async () => {
                const orgaId: OrganisationID = faker.string.uuid();
                const systemrecht: RollenSystemRecht = RollenSystemRecht.ROLLEN_VERWALTEN;
                const fakeResult: boolean = faker.datatype.boolean();
                const permissionsMock: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(fakeResult);
                const override: PermissionsOverride = new PermissionsOverride(permissionsMock);

                await expect(override.hasSystemrechtAtOrganisation(orgaId, systemrecht)).resolves.toBe(fakeResult);
                expect(permissionsMock.hasSystemrechtAtOrganisation).toHaveBeenCalledWith(orgaId, systemrecht);
            });
        });

        describe('when the recht is overridden', () => {
            it('should return true', async () => {
                const permissionsMock: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                const orgaId: OrganisationID = faker.string.uuid();
                const systemrecht: RollenSystemRecht = RollenSystemRecht.ROLLEN_VERWALTEN;
                const override: PermissionsOverride = new PermissionsOverride(permissionsMock).grantSystemrechteAtOrga(
                    orgaId,
                    [systemrecht],
                );

                await expect(override.hasSystemrechtAtOrganisation(orgaId, systemrecht)).resolves.toBe(true);
            });

            it('should not call underlying permissions', async () => {
                const permissionsMock: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                const orgaId: OrganisationID = faker.string.uuid();
                const systemrecht: RollenSystemRecht = RollenSystemRecht.ROLLEN_VERWALTEN;
                const override: PermissionsOverride = new PermissionsOverride(permissionsMock).grantSystemrechteAtOrga(
                    orgaId,
                    [systemrecht],
                );

                await override.hasSystemrechtAtOrganisation(orgaId, systemrecht);

                expect(permissionsMock.hasSystemrechtAtOrganisation).not.toHaveBeenCalled();
            });
        });
    });
});
