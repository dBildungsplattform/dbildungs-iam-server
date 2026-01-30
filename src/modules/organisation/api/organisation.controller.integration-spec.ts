import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { CallHandler, ExecutionContext, INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { Observable } from 'rxjs';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';
import {
    ConfigTestModule,
    createPassportUserMock,
    createPersonPermissionsMock,
    DatabaseTestModule,
    DoFactory,
    KeycloakConfigTestModule,
} from '../../../../test/utils/index.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { generatePassword } from '../../../shared/util/password-generator.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { StepUpGuard } from '../../authentication/api/steup-up.guard.js';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { KeycloakUserService } from '../../keycloak-administration/domain/keycloak-user.service.js';
import { KeycloakConfigModule } from '../../keycloak-administration/keycloak-config.module.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonenkontextFactory } from '../../personenkontext/domain/personenkontext.factory.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { DBiamPersonenkontextRepoInternal } from '../../personenkontext/persistence/internal-dbiam-personenkontext.repo.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { Organisation } from '../domain/organisation.js';
import { OrganisationApiModule } from '../organisation-api.module.js';
import { OrganisationEntity } from '../persistence/organisation.entity.js';
import { OrganisationRepository } from '../persistence/organisation.repository.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { OrganisationSpecificationErrorI18nTypes } from './dbiam-organisation.error.js';

describe('Organisation API', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let em: EntityManager;
    let rolleRepo: RolleRepo;
    let personRepo: PersonRepository;
    let dBiamPersonenkontextRepoInternal: DBiamPersonenkontextRepoInternal;
    let serviceProviderRepo: ServiceProviderRepo;
    let organisationRepo: OrganisationRepository;
    let rollenerweiterungRepo: RollenerweiterungRepo;
    let personenkontextFactory: PersonenkontextFactory;
    let personFactory: PersonFactory;

    let permissionsMock: DeepMocked<PersonPermissions>;
    let keycloakUserServiceMock: DeepMocked<KeycloakUserService>;

    function createPersonenkontext<WasPersisted extends boolean>(
        this: void,
        withId: WasPersisted,
        params: Partial<Personenkontext<boolean>> = {},
    ): Personenkontext<WasPersisted> {
        const personenkontext: Personenkontext<WasPersisted> = personenkontextFactory.construct<boolean>(
            withId ? faker.string.uuid() : undefined,
            withId ? faker.date.past() : undefined,
            withId ? faker.date.recent() : undefined,
            '',
            faker.string.uuid(),
            faker.string.uuid(),
            faker.string.uuid(),
        );

        Object.assign(personenkontext, params);

        return personenkontext;
    }

    beforeAll(async () => {
        keycloakUserServiceMock = createMock<KeycloakUserService>(KeycloakUserService);
        keycloakUserServiceMock.create.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                value: faker.string.uuid(),
            }),
        );
        keycloakUserServiceMock.setPassword.mockImplementation(() =>
            Promise.resolve({
                ok: true,
                value: faker.string.alphanumeric(16),
            }),
        );

        permissionsMock = createPersonPermissionsMock();

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                OrganisationApiModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: APP_INTERCEPTOR,
                    useValue: {
                        intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
                            const req: Request = context.switchToHttp().getRequest();
                            req.passportUser = createPassportUserMock(permissionsMock);
                            return next.handle();
                        },
                    },
                },
                {
                    provide: PersonPermissionsRepo,
                    useValue: createMock(PersonPermissionsRepo),
                },
                {
                    provide: KeycloakUserService,
                    useValue: keycloakUserServiceMock,
                },
            ],
        })
            .overrideModule(KeycloakConfigModule)
            .useModule(KeycloakConfigTestModule.forRoot({ isKeycloakRequired: true }))
            .compile();

        const stepUpGuard: StepUpGuard = module.get(StepUpGuard);
        stepUpGuard.canActivate = vi.fn().mockReturnValue(true);

        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        rolleRepo = module.get(RolleRepo);
        personRepo = module.get(PersonRepository);
        personenkontextFactory = module.get(PersonenkontextFactory);
        dBiamPersonenkontextRepoInternal = module.get(DBiamPersonenkontextRepoInternal);
        serviceProviderRepo = module.get(ServiceProviderRepo);
        organisationRepo = module.get(OrganisationRepository);
        rollenerweiterungRepo = module.get(RollenerweiterungRepo);
        personFactory = module.get(PersonFactory);

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, 10000000);

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('/DELETE klasse by organisationId', () => {
        describe('should return error', () => {
            it('if user is missing permissions', async () => {
                permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/organisationen/${faker.string.uuid()}`)
                    .send();

                expect(response.status).toBe(404);
            });

            it('if Organisation does NOT exist', async () => {
                permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/organisationen/${faker.string.uuid()}`)
                    .send();

                expect(response.status).toBe(404);
            });

            it('if Organisation is not a class', async () => {
                permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

                const organisation: OrganisationEntity = new OrganisationEntity();
                organisation.typ = OrganisationsTyp.SCHULE;
                await em.persistAndFlush(organisation);
                await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/organisationen/${faker.string.uuid()}`)
                    .send();

                expect(response.status).toBe(404);
            });

            it('if organisation is already assigned to a Personenkontext', async () => {
                permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

                const personData: Person<false> | DomainError = await personFactory.createNew({
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                    password: generatePassword(),
                });
                if (personData instanceof DomainError) {
                    throw personData;
                }
                const person: Person<true> | DomainError = await personRepo.save(personData);
                if (person instanceof DomainError) {
                    throw person;
                }

                const organisation: OrganisationEntity = new OrganisationEntity();
                organisation.typ = OrganisationsTyp.KLASSE;
                await em.persistAndFlush(organisation);
                await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

                const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, {
                        rollenart: RollenArt.LERN,
                    }),
                );
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                await dBiamPersonenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: person.id,
                        rolleId: rolle.id,
                        organisationId: organisation.id,
                    }),
                );

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/organisationen/${organisation.id}`)
                    .send();

                expect(response.status).toBe(400);
                expect(response.body).toEqual({
                    code: 400,
                    i18nKey: 'ORGANISATION_HAT_PERSONENKONTEXTE',
                });
            });
        });

        describe('should succeed', () => {
            it('if all conditions are passed', async () => {
                permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

                const parentOrganisation: OrganisationEntity = new OrganisationEntity();
                parentOrganisation.name = 'Parent Organisation';
                await em.persistAndFlush(parentOrganisation);
                const organisation: OrganisationEntity = new OrganisationEntity();
                organisation.typ = OrganisationsTyp.KLASSE;
                organisation.administriertVon = parentOrganisation.id;
                await em.persistAndFlush(organisation);
                await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/organisationen/${organisation.id}`)
                    .send();

                expect(response.status).toBe(204);
            });
        });
    });

    describe('/DELETE organisation', () => {
        describe('when all conditions pass', () => {
            it('should succeed', async () => {
                permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: true });
                permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
                const orga: OrganisationEntity = new OrganisationEntity();
                Object.assign(orga, DoFactory.createOrganisation(true, { typ: OrganisationsTyp.SCHULE }));
                await em.persistAndFlush(orga);

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/organisationen/${orga.id}`)
                    .send();
                expect(response.status).toBe(204);
            });
        });

        describe('when orga is still referenced', () => {
            type TestFixture = {
                entityType: string;
                setup: () => Promise<string>;
                i18nKey: OrganisationSpecificationErrorI18nTypes;
            };
            describe.each([
                {
                    entityType: 'Organisation',
                    setup: async (): Promise<string> => {
                        const savedOrga: Organisation<true> = await organisationRepo.save(
                            DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
                        );
                        await organisationRepo.save(
                            DoFactory.createOrganisation(false, {
                                typ: OrganisationsTyp.KLASSE,
                                administriertVon: savedOrga.id,
                            }),
                        );
                        return savedOrga.id;
                    },
                    i18nKey: OrganisationSpecificationErrorI18nTypes.ORGANISATION_HAT_KINDER,
                },
                {
                    entityType: 'Rolle',
                    setup: async (): Promise<string> => {
                        const savedOrga: Organisation<true> = await organisationRepo.save(
                            DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
                        );
                        await rolleRepo.save(
                            DoFactory.createRolle(false, {
                                administeredBySchulstrukturknoten: savedOrga.id,
                            }),
                        );
                        return savedOrga.id;
                    },
                    i18nKey: OrganisationSpecificationErrorI18nTypes.ORGANISATION_HAT_ROLLEN,
                },
                {
                    entityType: 'Personenkontext',
                    setup: async (): Promise<string> => {
                        const savedOrga: Organisation<true> = await organisationRepo.save(
                            DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
                        );

                        const person: Person<true> | DomainError = await personRepo.save(DoFactory.createPerson(false));
                        if (person instanceof DomainError) {
                            throw person;
                        }

                        const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                        if (rolle instanceof DomainError) {
                            throw rolle;
                        }

                        await dBiamPersonenkontextRepoInternal.save(
                            DoFactory.createPersonenkontext(false, {
                                organisationId: savedOrga.id,
                                personId: person.id,
                                rolleId: rolle.id,
                            }),
                        );
                        return savedOrga.id;
                    },
                    i18nKey: OrganisationSpecificationErrorI18nTypes.ORGANISATION_HAT_PERSONENKONTEXTE,
                },
                {
                    entityType: 'ServiceProvider',
                    setup: async (): Promise<string> => {
                        const savedOrga: Organisation<true> = await organisationRepo.save(
                            DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
                        );

                        await serviceProviderRepo.save(
                            DoFactory.createServiceProvider(false, { providedOnSchulstrukturknoten: savedOrga.id }),
                        );
                        return savedOrga.id;
                    },
                    i18nKey: OrganisationSpecificationErrorI18nTypes.ORGANISATION_HAT_ANGEBOTE,
                },
                {
                    entityType: 'Rollenerweiterung',
                    setup: async (): Promise<string> => {
                        const savedOrga: Organisation<true> = await organisationRepo.save(
                            DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
                        );
                        const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                        if (rolle instanceof DomainError) {
                            throw rolle;
                        }
                        const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                            DoFactory.createServiceProvider(false, {
                                merkmale: [ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG],
                            }),
                        );
                        await rollenerweiterungRepo.create(
                            DoFactory.createRollenerweiterung(false, {
                                organisationId: savedOrga.id,
                                rolleId: rolle.id,
                                serviceProviderId: serviceProvider.id,
                            }),
                        );
                        return savedOrga.id;
                    },
                    i18nKey: OrganisationSpecificationErrorI18nTypes.ORGANISATION_HAT_ROLLENERWEITERUNGEN,
                },
            ] as Array<TestFixture>)('by $entityType', ({ setup, i18nKey }: TestFixture) => {
                let orgaId: OrganisationID;
                beforeEach(async () => {
                    permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: true });
                    permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
                    orgaId = await setup();
                });

                it('should fail', async () => {
                    const response: Response = await request(app.getHttpServer() as App)
                        .delete(`/organisationen/${orgaId}`)
                        .send();
                    expect(response.status).toBe(400);
                    expect(response.body).toEqual(
                        expect.objectContaining({
                            code: 400,
                            i18nKey,
                        }),
                    );
                });
            });
        });
    });
});
