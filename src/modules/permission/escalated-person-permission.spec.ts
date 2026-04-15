import { DoFactory } from '../../../test/utils';
import { createMock, DeepMocked } from '../../../test/utils/createMock';
import { ClassLogger } from '../../core/logging/class-logger';
import { Organisation } from '../organisation/domain/organisation';
import { OrganisationRepository } from '../organisation/persistence/organisation.repository';
import { DBiamPersonenkontextRepo } from '../personenkontext/persistence/dbiam-personenkontext.repo';
import { RollenSystemRecht, RollenSystemRechtEnum } from '../rolle/domain/systemrecht';
import { EscalatedPersonPermissions } from './escalated-person-permissions';

describe('EscalatedPersonPermission', () => {
    const organisationRepo: DeepMocked<OrganisationRepository> =
        createMock<OrganisationRepository>(OrganisationRepository);
    Object.defineProperty(organisationRepo, 'ROOT_ORGANISATION_ID', {
        value: 'ROOT_ID',
        writable: false,
    });
    const rootOrga: Organisation<true> = DoFactory.createOrganisation(true, { id: 'ROOT_ID' });
    const oeffentlicheSchuleOrga: Organisation<true> = DoFactory.createOrganisation(true, {
        administriertVon: 'ROOT_ID',
    });

    const personenkontextRepo: DeepMocked<DBiamPersonenkontextRepo> =
        createMock<DBiamPersonenkontextRepo>(DBiamPersonenkontextRepo);
    const logger: DeepMocked<ClassLogger> = createMock<ClassLogger>(ClassLogger);

    describe('hasSystemrechteAtOrganisation', () => {
        describe('when permission is escalated at root', () => {
            it('should return true if permission is escalated for all systemrechte', async () => {
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [{ orgaId: 'ROOT', systemrechte: 'ALL' }],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation('someOrgaId', [
                        RollenSystemRecht.PERSONEN_VERWALTEN,
                    ]),
                ).resolves.toBe(true);
            });

            it('should return false if permission is not escalated at root, but necessary orga is root', async () => {
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [
                        {
                            orgaId: 'someOtherOrgaId',
                            systemrechte: [
                                RollenSystemRechtEnum.PERSONEN_VERWALTEN,
                                RollenSystemRechtEnum.ANGEBOTE_VERWALTEN,
                            ],
                        },
                    ],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation('ROOT_ID', [
                        RollenSystemRecht.PERSONEN_VERWALTEN,
                    ]),
                ).resolves.toBe(false);
            });

            it('should return true if permission is escalated for all necessary systemrechte', async () => {
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [
                        {
                            orgaId: 'ROOT_ID',
                            systemrechte: [
                                RollenSystemRechtEnum.PERSONEN_VERWALTEN,
                                RollenSystemRechtEnum.PERSONEN_ANLEGEN,
                                RollenSystemRechtEnum.ANGEBOTE_VERWALTEN,
                            ],
                        },
                    ],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation('ROOT_ID', [
                        RollenSystemRecht.PERSONEN_VERWALTEN,
                        RollenSystemRecht.ANGEBOTE_VERWALTEN,
                    ]),
                ).resolves.toBe(true);
            });

            it('should return false if permission is not escalated for all necessary systemrechte', async () => {
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [
                        {
                            orgaId: 'ROOT_ID',
                            systemrechte: [RollenSystemRechtEnum.PERSONEN_VERWALTEN],
                        },
                    ],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation('ROOT_ID', [
                        RollenSystemRecht.PERSONEN_VERWALTEN,
                        RollenSystemRecht.ANGEBOTE_VERWALTEN,
                    ]),
                ).resolves.toBe(false);
            });

            it('should return true if permission is escalated for some of the necessary systemrechte', async () => {
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [
                        {
                            orgaId: 'ROOT_ID',
                            systemrechte: [RollenSystemRechtEnum.PERSONEN_VERWALTEN],
                        },
                    ],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation(
                        'ROOT_ID',
                        [RollenSystemRecht.PERSONEN_VERWALTEN, RollenSystemRecht.ANGEBOTE_VERWALTEN],
                        false,
                    ),
                ).resolves.toBe(true);
            });

            it('should return false if permission is not escalated for any necessary systemrechte', async () => {
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [
                        {
                            orgaId: 'ROOT_ID',
                            systemrechte: [RollenSystemRechtEnum.KLASSEN_VERWALTEN],
                        },
                    ],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation(
                        'ROOT_ID',
                        [RollenSystemRecht.PERSONEN_VERWALTEN, RollenSystemRecht.ANGEBOTE_VERWALTEN],
                        false,
                    ),
                ).resolves.toBe(false);
            });
        });

        describe('when permission is escalated at organisation level', () => {
            it('should return true if permission is escalated to all at same orga as necessary', async () => {
                const schoolOrga: Organisation<true> = DoFactory.createOrganisation(true, {
                    administriertVon: oeffentlicheSchuleOrga.id,
                });
                organisationRepo.findParentOrgasForIds.mockResolvedValue([
                    rootOrga,
                    oeffentlicheSchuleOrga,
                    schoolOrga,
                ]);
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [
                        {
                            orgaId: schoolOrga.id,
                            systemrechte: 'ALL',
                        },
                    ],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation(
                        schoolOrga.id,
                        [RollenSystemRecht.PERSONEN_VERWALTEN, RollenSystemRecht.ANGEBOTE_VERWALTEN],
                        true,
                    ),
                ).resolves.toBe(true);
            });
            it('should return true if permission is escalated to all at parent orga', async () => {
                const schoolOrga: Organisation<true> = DoFactory.createOrganisation(true, {
                    administriertVon: oeffentlicheSchuleOrga.id,
                });
                organisationRepo.findParentOrgasForIds.mockResolvedValue([
                    rootOrga,
                    oeffentlicheSchuleOrga,
                    schoolOrga,
                ]);
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [
                        {
                            orgaId: oeffentlicheSchuleOrga.id,
                            systemrechte: 'ALL',
                        },
                    ],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation(
                        schoolOrga.id,
                        [RollenSystemRecht.PERSONEN_VERWALTEN, RollenSystemRecht.ANGEBOTE_VERWALTEN],
                        true,
                    ),
                ).resolves.toBe(true);
            });

            it('should return true if permission is escalated to all necessary systemrechte at parent orga', async () => {
                const schoolOrga: Organisation<true> = DoFactory.createOrganisation(true, {
                    administriertVon: oeffentlicheSchuleOrga.id,
                });
                organisationRepo.findParentOrgasForIds.mockResolvedValue([
                    rootOrga,
                    oeffentlicheSchuleOrga,
                    schoolOrga,
                ]);
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [
                        {
                            orgaId: oeffentlicheSchuleOrga.id,
                            systemrechte: [
                                RollenSystemRechtEnum.PERSONEN_VERWALTEN,
                                RollenSystemRechtEnum.ANGEBOTE_VERWALTEN,
                                RollenSystemRechtEnum.KLASSEN_VERWALTEN,
                            ],
                        },
                    ],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation(
                        schoolOrga.id,
                        [RollenSystemRecht.PERSONEN_VERWALTEN, RollenSystemRecht.ANGEBOTE_VERWALTEN],
                        true,
                    ),
                ).resolves.toBe(true);
            });

            it('should return false if permission is not escalated to all necessary systemrechte at parent orga', async () => {
                const schoolOrga: Organisation<true> = DoFactory.createOrganisation(true, {
                    administriertVon: oeffentlicheSchuleOrga.id,
                });
                organisationRepo.findParentOrgasForIds.mockResolvedValue([
                    rootOrga,
                    oeffentlicheSchuleOrga,
                    schoolOrga,
                ]);
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [
                        {
                            orgaId: oeffentlicheSchuleOrga.id,
                            systemrechte: [
                                RollenSystemRechtEnum.PERSONEN_VERWALTEN,
                                RollenSystemRechtEnum.KLASSEN_VERWALTEN,
                            ],
                        },
                    ],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation(
                        schoolOrga.id,
                        [RollenSystemRecht.PERSONEN_VERWALTEN, RollenSystemRecht.ANGEBOTE_VERWALTEN],
                        true,
                    ),
                ).resolves.toBe(false);
            });

            it('should return true if permission is escalated to some necessary systemrechte at parent orga', async () => {
                const schoolOrga: Organisation<true> = DoFactory.createOrganisation(true, {
                    administriertVon: oeffentlicheSchuleOrga.id,
                });
                organisationRepo.findParentOrgasForIds.mockResolvedValue([
                    rootOrga,
                    oeffentlicheSchuleOrga,
                    schoolOrga,
                ]);
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [
                        {
                            orgaId: oeffentlicheSchuleOrga.id,
                            systemrechte: [
                                RollenSystemRechtEnum.PERSONEN_VERWALTEN,
                                RollenSystemRechtEnum.KLASSEN_VERWALTEN,
                            ],
                        },
                    ],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation(
                        schoolOrga.id,
                        [RollenSystemRecht.PERSONEN_VERWALTEN, RollenSystemRecht.ANGEBOTE_VERWALTEN],
                        false,
                    ),
                ).resolves.toBe(true);
            });

            it('should return false if no necessary permission is granted', async () => {
                const schoolOrga: Organisation<true> = DoFactory.createOrganisation(true, {
                    administriertVon: oeffentlicheSchuleOrga.id,
                });
                organisationRepo.findParentOrgasForIds.mockResolvedValue([
                    rootOrga,
                    oeffentlicheSchuleOrga,
                    schoolOrga,
                ]);
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [
                        {
                            orgaId: oeffentlicheSchuleOrga.id,
                            systemrechte: [
                                RollenSystemRechtEnum.PERSONEN_VERWALTEN,
                                RollenSystemRechtEnum.KLASSEN_VERWALTEN,
                            ],
                        },
                    ],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation(
                        schoolOrga.id,
                        [RollenSystemRecht.ROLLEN_ERWEITERN, RollenSystemRecht.ANGEBOTE_VERWALTEN],
                        false,
                    ),
                ).resolves.toBe(false);
            });

            it('should return true if all necessary systemrechte are escalated at distributed over multiple orgas', async () => {
                const schoolOrga: Organisation<true> = DoFactory.createOrganisation(true, {
                    administriertVon: oeffentlicheSchuleOrga.id,
                });
                organisationRepo.findParentOrgasForIds.mockResolvedValue([
                    rootOrga,
                    oeffentlicheSchuleOrga,
                    schoolOrga,
                ]);
                const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                    { name: 'testInstance' },
                    [
                        {
                            orgaId: oeffentlicheSchuleOrga.id,
                            systemrechte: [RollenSystemRechtEnum.ANGEBOTE_VERWALTEN],
                        },
                        {
                            orgaId: schoolOrga.id,
                            systemrechte: [RollenSystemRechtEnum.PERSONEN_VERWALTEN],
                        },
                    ],
                    organisationRepo,
                    personenkontextRepo,
                    logger,
                );

                await expect(
                    escalatedPersonPermission.hasSystemrechteAtOrganisation(
                        schoolOrga.id,
                        [RollenSystemRecht.PERSONEN_VERWALTEN, RollenSystemRecht.ANGEBOTE_VERWALTEN],
                        true,
                    ),
                ).resolves.toBe(true);
            });
        });
    });

    describe('hasSystemrechteAtRootOrganisation', () => {
        it('should return true if permission is escalated at root for all systemrechte', async () => {
            const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                { name: 'testInstance' },
                [{ orgaId: rootOrga.id, systemrechte: 'ALL' }],
                organisationRepo,
                personenkontextRepo,
                logger,
            );

            await expect(
                escalatedPersonPermission.hasSystemrechteAtRootOrganisation([RollenSystemRecht.PERSONEN_VERWALTEN]),
            ).resolves.toBe(true);
        });

        it('should return false if permission is not escalated at root for all systemrechte', async () => {
            organisationRepo.findParentOrgasForIds.mockResolvedValue([rootOrga, oeffentlicheSchuleOrga]);
            const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                { name: 'testInstance' },
                [{ orgaId: oeffentlicheSchuleOrga.id, systemrechte: 'ALL' }],
                organisationRepo,
                personenkontextRepo,
                logger,
            );

            await expect(
                escalatedPersonPermission.hasSystemrechteAtRootOrganisation([RollenSystemRecht.PERSONEN_VERWALTEN]),
            ).resolves.toBe(false);
        });
    });

    describe('hasSystemrechtAtOrganisation', () => {
        it('should return true if permission is escalated at root for all systemrechte', async () => {
            const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                { name: 'testInstance' },
                [{ orgaId: rootOrga.id, systemrechte: 'ALL' }],
                organisationRepo,
                personenkontextRepo,
                logger,
            );

            await expect(
                escalatedPersonPermission.hasSystemrechtAtOrganisation(
                    oeffentlicheSchuleOrga.id,
                    RollenSystemRecht.PERSONEN_VERWALTEN,
                ),
            ).resolves.toBe(true);
        });

        it('should return false if necessary permission is not granted', async () => {
            organisationRepo.findParentOrgasForIds.mockResolvedValue([rootOrga, oeffentlicheSchuleOrga]);
            const escalatedPersonPermission: EscalatedPersonPermissions = EscalatedPersonPermissions.createNew(
                { name: 'testInstance' },
                [{ orgaId: oeffentlicheSchuleOrga.id, systemrechte: [RollenSystemRechtEnum.PERSONEN_ANLEGEN] }],
                organisationRepo,
                personenkontextRepo,
                logger,
            );

            await expect(
                escalatedPersonPermission.hasSystemrechtAtOrganisation(
                    oeffentlicheSchuleOrga.id,
                    RollenSystemRecht.PERSONEN_VERWALTEN,
                ),
            ).resolves.toBe(false);
        });
    });
});
