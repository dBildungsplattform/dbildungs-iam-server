import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PersonenkontextAnlage } from './personenkontext-anlage.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { DoFactory } from '../../../../test/utils/index.js';
import { Personenkontext } from './personenkontext.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { faker } from '@faker-js/faker';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextAnlageFactory } from './personenkontext-anlage.factory.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { PersonenkontextFactory } from './personenkontext.factory.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';

function createPersonenkontext<WasPersisted extends boolean>(
    this: void,
    factory: PersonenkontextFactory,
    withId: WasPersisted,
    params: Partial<Personenkontext<boolean>> = {},
): Personenkontext<WasPersisted> {
    const personenkontext: Personenkontext<WasPersisted> = factory.construct<boolean>(
        withId ? faker.string.uuid() : undefined,
        withId ? faker.date.past() : undefined,
        withId ? faker.date.recent() : undefined,
        faker.string.uuid(),
        faker.string.uuid(),
        faker.string.uuid(),
    );

    Object.assign(personenkontext, params);

    return personenkontext;
}

function createRolleOrganisationsPersonKontext(
    factory: PersonenkontextFactory,
): [Rolle<true>, OrganisationDo<true>, OrganisationDo<true>, OrganisationDo<true>, Personenkontext<true>] {
    const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LEHR });
    const parentOrganisation: OrganisationDo<true> = DoFactory.createOrganisation(true, {
        typ: OrganisationsTyp.TRAEGER,
    });
    const childOrganisation: OrganisationDo<true> = DoFactory.createOrganisation(true, {
        typ: OrganisationsTyp.SCHULE,
    });
    const childsChildOrganisation: OrganisationDo<true> = DoFactory.createOrganisation(true, {
        typ: OrganisationsTyp.KLASSE,
    });
    childsChildOrganisation.administriertVon = childOrganisation.id;
    childOrganisation.administriertVon = parentOrganisation.id;
    /* anlage.organisationId = childOrganisation.id;
    anlage.rolleId = rolle.id;*/
    const personenkontext: Personenkontext<true> = createPersonenkontext(factory, true, {
        rolleId: rolle.id,
        organisationId: parentOrganisation.id,
    });
    return [rolle, parentOrganisation, childOrganisation, childsChildOrganisation, personenkontext];
}

describe('PersonenkontextAnlage', () => {
    const LIMIT: number = 25;
    let module: TestingModule;
    let rolleRepoMock: DeepMocked<RolleRepo>;
    let organisationRepoMock: DeepMocked<OrganisationRepo>;
    let dBiamPersonenkontextRepoMock: DeepMocked<DBiamPersonenkontextRepo>;
    let personPermissionsMock: DeepMocked<PersonPermissions>;
    let anlage: PersonenkontextAnlage;
    let personenkontextAnlageFactory: PersonenkontextAnlageFactory;
    let personenkontextFactory: PersonenkontextFactory;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                PersonenkontextAnlageFactory,
                PersonenkontextFactory,
                {
                    provide: RolleRepo,
                    useValue: createMock<RolleRepo>(),
                },
                {
                    provide: OrganisationRepo,
                    useValue: createMock<OrganisationRepo>(),
                },
                {
                    provide: OrganisationRepository,
                    useValue: createMock<OrganisationRepository>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
                {
                    provide: DBiamPersonenkontextRepo,
                    useValue: createMock<DBiamPersonenkontextRepo>(),
                },
            ],
        }).compile();
        rolleRepoMock = module.get(RolleRepo);
        organisationRepoMock = module.get(OrganisationRepo);
        dBiamPersonenkontextRepoMock = module.get(DBiamPersonenkontextRepo);
        personPermissionsMock = createMock<PersonPermissions>();
        personenkontextFactory = module.get(PersonenkontextFactory);
        personenkontextAnlageFactory = module.get(PersonenkontextAnlageFactory);
        personenkontextFactory = module.get(PersonenkontextFactory);
        anlage = personenkontextAnlageFactory.createNew();
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should be defined', () => {
        expect(anlage).toBeDefined();
    });

    describe('findSchulstrukturknoten', () => {
        it('should return list of schulstrukturknoten when parent-organisation is matching', async () => {
            const [rolle, parentOrganisation, , , personenkontext]: [
                Rolle<true>,
                OrganisationDo<true>,
                OrganisationDo<true>,
                OrganisationDo<true>,
                Personenkontext<true>,
            ] = createRolleOrganisationsPersonKontext(personenkontextFactory);
            const organisationen: OrganisationDo<true>[] = [parentOrganisation];
            const personenkontexte: Personenkontext<true>[] = [personenkontext];

            organisationRepoMock.findByNameOrKennung.mockResolvedValue(organisationen);
            dBiamPersonenkontextRepoMock.findByRolle.mockResolvedValue(personenkontexte);

            organisationRepoMock.findById.mockResolvedValue(parentOrganisation);

            const counted2: Counted<OrganisationDo<true>> = [[], 1];
            organisationRepoMock.findBy.mockResolvedValueOnce(counted2); //mock call in findChildOrganisations, 2nd time (recursive)

            const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                personPermissionsMock,
                rolle.id,
                parentOrganisation.name!,
                LIMIT,
            );
            expect(result).toHaveLength(1);
        });

        describe('matching of parent or child SSK', () => {
            it('should return list of schulstrukturknoten when child-organisation is matching', async () => {
                const [rolle, parent, child, subchild]: [
                    Rolle<true>,
                    OrganisationDo<true>,
                    OrganisationDo<true>,
                    OrganisationDo<true>,
                    Personenkontext<true>,
                ] = createRolleOrganisationsPersonKontext(personenkontextFactory);

                const foundByName: OrganisationDo<true>[] = [child];

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([child.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue(foundByName);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(parent); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([parent, child, subchild]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    child.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(1);
            });

            it('should return list of schulstrukturknoten when child of child-organisation is matching with one results', async () => {
                const [rolle, parent, child, childOfChild]: [
                    Rolle<true>,
                    OrganisationDo<true>,
                    OrganisationDo<true>,
                    OrganisationDo<true>,
                    Personenkontext<true>,
                ] = createRolleOrganisationsPersonKontext(personenkontextFactory);

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([child.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([child, childOfChild]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(parent); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([parent, child, childOfChild]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    child.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(1);
            });

            it('should return list of schulstrukturknoten when a valid child with name exist', async () => {
                const [rolle, parent, child]: [
                    Rolle<true>,
                    OrganisationDo<true>,
                    OrganisationDo<true>,
                    OrganisationDo<true>,
                    Personenkontext<true>,
                ] = createRolleOrganisationsPersonKontext(personenkontextFactory);

                const foundByName: OrganisationDo<true>[] = [child];
                const personenkontext: Personenkontext<true> = createPersonenkontext(personenkontextFactory, true, {
                    rolleId: rolle.id,
                    organisationId: parent.id,
                });
                const personenkontexte: Personenkontext<true>[] = [personenkontext];

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([child.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue(foundByName);
                dBiamPersonenkontextRepoMock.findByRolle.mockResolvedValue(personenkontexte);
                organisationRepoMock.findById.mockResolvedValue(undefined); //mock call to find parent in findSchulstrukturknoten

                const counted: Counted<OrganisationDo<true>> = [foundByName, 1];
                organisationRepoMock.findBy.mockResolvedValue(counted); //mock call in findChildOrganisations

                await expect(
                    anlage.findSchulstrukturknoten(personPermissionsMock, rolle.id, child.name!, LIMIT),
                ).resolves.not.toThrow(Error);
            });
        });

        it('should return empty list when no rolle could be found', async () => {
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            const organisation: OrganisationDo<true> = DoFactory.createOrganisation(true);
            const organisationen: OrganisationDo<true>[] = [organisation];

            personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisation.id]);
            organisationRepoMock.findByNameOrKennung.mockResolvedValue(organisationen);
            rolleRepoMock.findById.mockResolvedValue(undefined);

            const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                personPermissionsMock,
                rolle.id,
                'nonexistent',
                LIMIT,
            );

            expect(result).toHaveLength(0);
        });

        it('should return empty list when no parent organisation could be found', async () => {
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            const organisation: OrganisationDo<true> = DoFactory.createOrganisation(true);
            const organisationen: OrganisationDo<true>[] = [organisation];

            personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisation.id]);
            organisationRepoMock.findByNameOrKennung.mockResolvedValue(organisationen);
            rolleRepoMock.findById.mockResolvedValue(rolle);
            organisationRepoMock.findById.mockResolvedValue(undefined);

            const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                personPermissionsMock,
                rolle.id,
                'nonexistent',
                LIMIT,
            );

            expect(result).toHaveLength(0);
        });

        it('should return empty list when no ssks could be found', async () => {
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            const personenkontext: Personenkontext<true> = createPersonenkontext(personenkontextFactory, true);
            const personenkontexte: Personenkontext<true>[] = [personenkontext];
            organisationRepoMock.findByNameOrKennung.mockResolvedValue([]);
            dBiamPersonenkontextRepoMock.findByRolle.mockResolvedValue(personenkontexte);

            const counted: Counted<OrganisationDo<true>> = [[], 0];
            organisationRepoMock.findBy.mockResolvedValueOnce(counted); //mock call in findChildOrganisations, 2nd time (recursive)

            const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                personPermissionsMock,
                rolle.id,
                'nonexistent',
                LIMIT,
            );
            expect(result).toHaveLength(0);
        });

        describe('filter organisations by RollenArt', () => {
            it('should return empty list, because orga as SCHULE does not match RollenArt SYSADMIN', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.SYSADMIN });
                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.SCHULE,
                });

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisationDo.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([organisationDo]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisationDo); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([organisationDo]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    organisationDo.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(0);
            });

            it('should return one element, because orga as LAND does match RollenArt SYSADMIN', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.SYSADMIN });
                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.LAND,
                });

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisationDo.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([organisationDo]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisationDo); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([organisationDo]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    organisationDo.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(1);
                expect(result).toContainEqual(organisationDo);
            });

            it('should return one element, because orga as ROOT does match RollenArt SYSADMIN', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.SYSADMIN });
                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.ROOT,
                });

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisationDo.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([organisationDo]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisationDo); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([organisationDo]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    organisationDo.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(1);
                expect(result).toContainEqual(organisationDo);
            });

            it('should return empty list, because orga as LAND does not match RollenArt LEIT', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LEIT });
                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.LAND,
                });

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisationDo.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([organisationDo]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisationDo); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([organisationDo]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    organisationDo.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(0);
            });

            it('should return one element, because orga as SCHULE does match RollenArt LEIT', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LEIT });
                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.SCHULE,
                });

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisationDo.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([organisationDo]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisationDo); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([organisationDo]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    organisationDo.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(1);
                expect(result).toContainEqual(organisationDo);
            });

            it('should return one element, because orga as SCHULE does match RollenArt LERN', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LERN });
                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.SCHULE,
                });

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisationDo.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([organisationDo]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisationDo); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([organisationDo]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    organisationDo.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(1);
                expect(result).toContainEqual(organisationDo);
            });

            it('should return one element, because orga as KLASSE does match RollenArt LERN', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LERN });
                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.KLASSE,
                });

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisationDo.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([organisationDo]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisationDo); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([organisationDo]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    organisationDo.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(1);
                expect(result).toContainEqual(organisationDo);
            });

            it('should return empty list, because orga as LAND does not match RollenArt LERN', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LERN });
                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.LAND,
                });

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisationDo.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([organisationDo]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisationDo); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([organisationDo]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    organisationDo.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(0);
            });

            it('should return one element, because orga as SCHULE does match RollenArt LEHR', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LEHR });
                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.SCHULE,
                });

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisationDo.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([organisationDo]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisationDo); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([organisationDo]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    organisationDo.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(1);
                expect(result).toContainEqual(organisationDo);
            });

            it('should return no element, because orga as KLASSE does not match RollenArt LEHR', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LEHR });
                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.KLASSE,
                });

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisationDo.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([organisationDo]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisationDo); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([organisationDo]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    organisationDo.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(0);
            });

            it('should return empty list, because orga as LAND does not match RollenArt LEHR', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LEHR });
                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.LAND,
                });

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisationDo.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([organisationDo]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisationDo); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([organisationDo]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    organisationDo.name!,
                    LIMIT,
                );
                expect(result).toHaveLength(0);
            });

            it('should not return klassen when excluded', async () => {
                const rolle: Rolle<true> = DoFactory.createRolle(true, { rollenart: RollenArt.LERN });
                const organisationDo: OrganisationDo<true> = DoFactory.createOrganisation(true, {
                    typ: OrganisationsTyp.KLASSE,
                });

                personPermissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue([organisationDo.id]);
                organisationRepoMock.findByNameOrKennung.mockResolvedValue([organisationDo]);
                rolleRepoMock.findById.mockResolvedValueOnce(rolle);
                organisationRepoMock.findById.mockResolvedValue(organisationDo); //mock call to find parent in findSchulstrukturknoten
                organisationRepoMock.findChildOrgasForIds.mockResolvedValueOnce([organisationDo]);

                const result: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
                    personPermissionsMock,
                    rolle.id,
                    organisationDo.name!,
                    LIMIT,
                    true,
                );
                expect(result).toHaveLength(0);
            });
        });
    });

    describe('findRollen', () => {
        it('should return list of rollen when they exist', async () => {
            const rolle: Rolle<true> = DoFactory.createRolle(true);
            rolleRepoMock.findByName.mockResolvedValue([rolle]);

            const result: Rolle<true>[] = await anlage.findRollen(rolle.name, LIMIT);
            expect(result).toEqual([rolle]);
        });

        it('should return empty list when no rollen exist', async () => {
            rolleRepoMock.findByName.mockResolvedValue(undefined);

            const result: Rolle<true>[] = await anlage.findRollen('nonexistent', LIMIT);
            expect(result).toEqual([]);
        });
    });
});
