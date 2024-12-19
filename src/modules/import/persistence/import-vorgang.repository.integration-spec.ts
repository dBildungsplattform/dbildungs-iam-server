import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM, RequiredEntityData } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import {
    ImportQueryOptions,
    ImportVorgangRepository,
    mapAggregateToData,
    mapEntityToAggregate,
} from './import-vorgang.repository.js';
import { ImportVorgang } from '../domain/import-vorgang.js';
import { ImportVorgangEntity } from './import-vorgang.entity.js';
import { ImportStatus } from '../domain/import.enums.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { generatePassword } from '../../../shared/util/password-generator.js';
import { Person } from '../../person/domain/person.js';
import { UsernameGeneratorService } from '../../person/domain/username-generator.service.js';
import { UserLockRepository } from '../../keycloak-administration/repository/user-lock.repository.js';
import { EventService } from '../../../core/eventbus/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { OrganisationEntity } from '../../organisation/persistence/organisation.entity.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { RolleModule } from '../../rolle/rolle.module.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationModule } from '../../organisation/organisation.module.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { OxUserBlacklistRepo } from '../../person/persistence/ox-user-blacklist.repo.js';

describe('ImportVorgangRepository', () => {
    let module: TestingModule;
    let sut: ImportVorgangRepository;
    let orm: MikroORM;
    let em: EntityManager;
    let personFactory: PersonFactory;
    let personRepository: PersonRepository;
    let rolleRepo: RolleRepo;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                RolleModule,
                OrganisationModule,
                MapperTestModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
            ],
            providers: [
                ImportVorgangRepository,
                PersonFactory,
                PersonRepository,
                UsernameGeneratorService,
                {
                    provide: EventService,
                    useValue: createMock<EventService>(),
                },
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
                },
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>({
                        create: () =>
                            Promise.resolve({
                                ok: true,
                                value: faker.string.uuid(),
                            }),
                        setPassword: () =>
                            Promise.resolve({
                                ok: true,
                                value: faker.string.alphanumeric(16),
                            }),
                    }),
                },
                {
                    provide: UserLockRepository,
                    useValue: createMock<UserLockRepository>(),
                },

                {
                    provide: OxUserBlacklistRepo,
                    useValue: createMock<OxUserBlacklistRepo>(),
                },
            ],
        }).compile();
        sut = module.get(ImportVorgangRepository);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        personFactory = module.get(PersonFactory);
        personRepository = module.get(PersonRepository);
        rolleRepo = module.get(RolleRepo);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    async function createPerson(): Promise<Person<true>> {
        const personResult: Person<false> | DomainError = await personFactory.createNew({
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
            username: faker.internet.userName(),
            password: generatePassword(),
        });
        if (personResult instanceof DomainError) {
            throw personResult;
        }
        const person: Person<true> | DomainError = await personRepository.create(personResult);
        if (person instanceof DomainError) {
            throw person;
        }

        return person;
    }

    async function createOrga(): Promise<string> {
        const organisation: OrganisationEntity = new OrganisationEntity();
        organisation.typ = OrganisationsTyp.SCHULE;
        await em.persistAndFlush(organisation);
        await em.findOneOrFail(OrganisationEntity, { id: organisation.id });
        return organisation.id;
    }

    async function createRolle(orgaId: string): Promise<Rolle<true>> {
        const rolle: Rolle<true> | DomainError = await rolleRepo.save(
            DoFactory.createRolle(false, {
                administeredBySchulstrukturknoten: orgaId,
                rollenart: RollenArt.LERN,
            }),
        );
        if (rolle instanceof DomainError) throw Error();
        return rolle;
    }

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('mapAggregateToData', () => {
        it('should return ImportVorgang RequiredEntityData', () => {
            const importVorgang: ImportVorgang<true> = ImportVorgang.construct(
                faker.string.uuid(),
                faker.date.past(),
                faker.date.recent(),
                faker.internet.userName(),
                faker.lorem.word(),
                faker.lorem.word(),
                100,
                ImportStatus.STARTED,
                0,
                faker.string.uuid(),
                faker.string.uuid(),
                faker.string.uuid(),
            );

            const expectedProperties: string[] = [
                'importByUsername',
                'rollename',
                'organisationsname',
                'dataItemCount',
                'status',
                'totalDataItemImported',
                'importByPersonId',
                'rolleId',
                'organisationId',
            ];

            const result: RequiredEntityData<ImportVorgangEntity> = mapAggregateToData(importVorgang);

            expectedProperties.forEach((prop: string) => {
                expect(result).toHaveProperty(prop);
            });
        });
    });

    describe('mapEntityToAggregate', () => {
        it('should return New Aggregate', () => {
            const entiity: ImportVorgangEntity = em.create(
                ImportVorgangEntity,
                mapAggregateToData(DoFactory.createImportVorgang(true)),
            );
            const importVorgang: ImportVorgang<true> = mapEntityToAggregate(entiity);

            expect(importVorgang).toBeInstanceOf(ImportVorgang);
        });
    });

    describe('save', () => {
        it('should create a new ImportVorgang', async () => {
            const person: Person<true> = await createPerson();
            const organisationId: string = await createOrga();
            const rolle: Rolle<true> = await createRolle(organisationId);

            const importVorgang: ImportVorgang<false> = DoFactory.createImportVorgang(false, {
                importByPersonId: person.id,
                rolleId: rolle.id,
                organisationId: organisationId,
            });

            const result: ImportVorgang<true> = await sut.save(importVorgang);

            expect(result.id).toBeDefined();
        });

        it('should update an existing ImportVorgang', async () => {
            const person: Person<true> = await createPerson();
            const organisationId: string = await createOrga();
            const rolle: Rolle<true> = await createRolle(organisationId);

            const importVorgang: ImportVorgang<false> = DoFactory.createImportVorgang(false, {
                importByPersonId: person.id,
                rolleId: rolle.id,
                organisationId: organisationId,
            });
            const createdImportVorgang: ImportVorgang<true> = await sut.save(importVorgang);
            createdImportVorgang.status = ImportStatus.VALID;

            const result: ImportVorgang<true> = await sut.save(createdImportVorgang);

            expect(result.id).toBeDefined();
            expect(result.status).toBe(ImportStatus.VALID);
        });
    });

    describe('findById', () => {
        it('should return null if the ImportVorgang does not exist', async () => {
            const result: Option<ImportVorgang<true>> = await sut.findById(faker.string.uuid());

            expect(result).toBeNull();
        });

        it('should return the ImportVorgang', async () => {
            const person: Person<true> = await createPerson();
            const organisationId: string = await createOrga();
            const rolle: Rolle<true> = await createRolle(organisationId);

            const importVorgang: ImportVorgang<false> = DoFactory.createImportVorgang(false, {
                importByPersonId: person.id,
                rolleId: rolle.id,
                organisationId: organisationId,
            });
            const savedImportVorgang: ImportVorgang<true> = await sut.save(importVorgang);

            const result: Option<ImportVorgang<true>> = await sut.findById(savedImportVorgang.id);

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(ImportVorgang);
        });
    });

    describe('findAuthorized', () => {
        describe('should import history data', () => {
            let importVorgang1: ImportVorgang<false>;
            let importVorgang2: ImportVorgang<false>;
            let importVorgang3: ImportVorgang<true>;
            let entity1: ImportVorgangEntity;
            let entity2: ImportVorgangEntity;
            let entity3: ImportVorgangEntity;

            let importByPersonId: string = faker.string.uuid();
            let rolleId: string = faker.string.uuid();
            let orgaId1: string = faker.string.uuid();
            let orgaId2: string = faker.string.uuid();

            beforeEach(async () => {
                const personA: Person<true> = await createPerson();
                orgaId1 = await createOrga();
                const rolle: Rolle<true> = await createRolle(orgaId1);

                importByPersonId = personA.id;
                rolleId = rolle.id;

                const personB: Person<true> = await createPerson();
                orgaId2 = await createOrga();
                const rolle2: Rolle<true> = await createRolle(orgaId2);

                const orgaId3: string = await createOrga();

                importVorgang1 = DoFactory.createImportVorgang(false, {
                    importByPersonId: importByPersonId,
                    rolleId: rolle2.id,
                    organisationId: orgaId1,
                });
                importVorgang2 = DoFactory.createImportVorgang(false, {
                    importByPersonId: importByPersonId,
                    rolleId: rolleId,
                    organisationId: orgaId2,
                });
                importVorgang3 = DoFactory.createImportVorgang(true, {
                    importByPersonId: personB.id,
                    rolleId: rolleId,
                    organisationId: orgaId3,
                    status: ImportStatus.COMPLETED,
                });

                entity1 = em.create(ImportVorgangEntity, mapAggregateToData(importVorgang1));
                entity2 = em.create(ImportVorgangEntity, mapAggregateToData(importVorgang2));
                entity3 = em.create(ImportVorgangEntity, mapAggregateToData(importVorgang3));
                await em.persistAndFlush([entity1, entity2, entity3]);
            });

            afterEach(async () => {
                await em.removeAndFlush([entity1, entity2, entity3]);
            });

            it('when search by importByPersonId', async () => {
                const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                permissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

                const [result, total]: [ImportVorgang<true>[], number] = await sut.findAuthorized(permissions, {
                    personId: importByPersonId,
                });

                expect(result.length).toBe(2);
                expect(total).toBe(2);
            });

            it('when search by rolleIds', async () => {
                const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                permissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

                const [result, total]: [ImportVorgang<true>[], number] = await sut.findAuthorized(permissions, {
                    rolleIds: [rolleId],
                });

                expect(result.length).toBe(2);
                expect(total).toBe(2);
            });

            it('when search by organisationIds', async () => {
                const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                permissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

                const [result, total]: [ImportVorgang<true>[], number] = await sut.findAuthorized(permissions, {
                    organisationIds: [orgaId1, orgaId2],
                });

                expect(result.length).toBe(2);
                expect(total).toBe(2);
            });

            it('should return import history when search by status', async () => {
                const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                permissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

                const [result, total]: [ImportVorgang<true>[], number] = await sut.findAuthorized(permissions, {
                    status: ImportStatus.COMPLETED,
                });

                expect(result.length).toBe(1);
                expect(total).toBe(1);
            });
        });

        describe('Should return empty array', () => {
            it('when admin des not have IMPORT_DURCHFUEHREN rights', async () => {
                const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                permissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(false);

                const [result, total]: [ImportVorgang<true>[], number] = await sut.findAuthorized(
                    permissions,
                    createMock<ImportQueryOptions>(),
                );

                expect(result).toEqual([]);
                expect(total).toBe(0);
            });

            it('if no import transaction was found', async () => {
                const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                permissions.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(true);

                const [result, total]: [ImportVorgang<true>[], number] = await sut.findAuthorized(permissions, {
                    status: ImportStatus.FAILED,
                });

                expect(result.length).toBe(0);
                expect(total).toBe(0);
            });
        });
    });
});
