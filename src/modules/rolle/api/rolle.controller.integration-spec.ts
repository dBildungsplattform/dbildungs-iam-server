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
    createPersonPermissionsMock,
    DatabaseTestModule,
    DoFactory,
    KeycloakConfigTestModule,
    LoggingTestModule,
} from '../../../../test/utils/index.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { PagedResponse } from '../../../shared/paging/index.js';
import { generatePassword } from '../../../shared/util/password-generator.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { StepUpGuard } from '../../authentication/api/steup-up.guard.js';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import {
    PersonenkontextRolleWithOrganisation,
    PersonPermissions,
} from '../../authentication/domain/person-permissions.js';
import { PassportUser } from '../../authentication/types/user.js';
import { KeycloakUserService } from '../../keycloak-administration/domain/keycloak-user.service.js';
import { KeycloakConfigModule } from '../../keycloak-administration/keycloak-config.module.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationEntity } from '../../organisation/persistence/organisation.entity.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { DBiamPersonenkontextRepoInternal } from '../../personenkontext/persistence/internal-dbiam-personenkontext.repo.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RollenArt, RollenMerkmal } from '../domain/rolle.enums.js';
import { RollenSystemRecht, RollenSystemRechtEnum } from '../domain/systemrecht.js';
import { Rolle } from '../domain/rolle.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RolleApiModule } from '../rolle-api.module.js';
import { AddSystemrechtBodyParams } from './add-systemrecht.body.params.js';
import { CreateRolleBodyParams } from './create-rolle.body.params.js';
import { DbiamRolleError } from './dbiam-rolle.error.js';
import { RolleServiceProviderBodyParams } from './rolle-service-provider.body.params.js';
import { RolleWithServiceProvidersResponse } from './rolle-with-serviceprovider.response.js';
import { RolleResponse } from './rolle.response.js';
import { ServiceProviderIdNameResponse } from './serviceprovider-id-name.response.js';
import { UpdateRolleBodyParams } from './update-rolle.body.params.js';
import { SystemRechtResponse } from './systemrecht.response.js';

describe('Rolle API', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let em: EntityManager;
    let rolleRepo: RolleRepo;
    let personRepo: PersonRepository;
    let serviceProviderRepo: ServiceProviderRepo;
    let organisationRepo: OrganisationRepository;
    let dBiamPersonenkontextRepoInternal: DBiamPersonenkontextRepoInternal;
    let personpermissionsRepoMock: DeepMocked<PersonPermissionsRepo>;
    let personFactory: PersonFactory;
    let permissionsMock: DeepMocked<PersonPermissions>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                RolleApiModule,
                LoggingTestModule,
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
                            req.passportUser = {
                                async personPermissions() {
                                    return personpermissionsRepoMock.loadPersonPermissions('');
                                },
                            } as PassportUser;
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
                    useValue: createMock<KeycloakUserService>(KeycloakUserService, {
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
            ],
        })
            .overrideModule(KeycloakConfigModule)
            .useModule(KeycloakConfigTestModule.forRoot({ isKeycloakRequired: true }))
            .compile();

        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        rolleRepo = module.get(RolleRepo);
        personRepo = module.get(PersonRepository);
        serviceProviderRepo = module.get(ServiceProviderRepo);
        organisationRepo = module.get(OrganisationRepository);
        personFactory = module.get(PersonFactory);

        const stepUpGuard: StepUpGuard = module.get(StepUpGuard);
        stepUpGuard.canActivate = vi.fn().mockReturnValue(true);

        dBiamPersonenkontextRepoInternal = module.get(DBiamPersonenkontextRepoInternal);
        personpermissionsRepoMock = module.get(PersonPermissionsRepo);
        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, 10000000);

    afterAll(async () => {
        if (await orm?.isConnected()) {
            await orm.close();
        }

        if (app) {
            await app.close();
        }
    });

    beforeEach(async () => {
        permissionsMock = createPersonPermissionsMock();
        personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
        permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('/POST rolle', () => {
        it('should return created rolle', async () => {
            const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
            const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
            const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                {
                    organisation: savedUserOrganisation,
                    rolle: { systemrechte: [], serviceProviderIds: [] },
                },
            ];
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
            permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

            const organisation: OrganisationEntity = new OrganisationEntity();
            await em.persistAndFlush(organisation);

            await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

            const params: CreateRolleBodyParams = {
                name: faker.person.jobTitle(),
                administeredBySchulstrukturknoten: organisation.id,
                rollenart: faker.helpers.enumValue(RollenArt),
                merkmale: [faker.helpers.enumValue(RollenMerkmal)],
                systemrechte: [],
            };

            const response: Response = await request(app.getHttpServer() as App)
                .post('/rolle')
                .send(params);

            expect(response.status).toBe(201);
            expect(response.body).toEqual(expect.objectContaining(params));
        });

        it('should save rolle to db', async () => {
            const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
            const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
            const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                {
                    organisation: savedUserOrganisation,
                    rolle: { systemrechte: [], serviceProviderIds: [] },
                },
            ];
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
            permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

            const organisation: OrganisationEntity = new OrganisationEntity();
            await em.persistAndFlush(organisation);

            const params: CreateRolleBodyParams = {
                name: faker.person.jobTitle(),
                administeredBySchulstrukturknoten: organisation.id,
                rollenart: faker.helpers.enumValue(RollenArt),
                merkmale: [faker.helpers.enumValue(RollenMerkmal)],
                systemrechte: [faker.helpers.enumValue(RollenSystemRechtEnum)],
            };

            const response: Response = await request(app.getHttpServer() as App)
                .post('/rolle')
                .send(params);
            const rolle: RolleResponse = response.body as RolleResponse;

            await em.findOneOrFail(RolleEntity, { id: rolle.id });
        });

        it('should fail if the organisation does not exist', async () => {
            const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
            const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
            const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                {
                    organisation: savedUserOrganisation,
                    rolle: { systemrechte: [], serviceProviderIds: [] },
                },
            ];
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
            permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

            const params: CreateRolleBodyParams = {
                name: faker.person.jobTitle(),
                administeredBySchulstrukturknoten: faker.string.uuid(),
                rollenart: faker.helpers.enumValue(RollenArt),
                merkmale: [faker.helpers.enumValue(RollenMerkmal)],
                systemrechte: [faker.helpers.enumValue(RollenSystemRechtEnum)],
            };

            const response: Response = await request(app.getHttpServer() as App)
                .post('/rolle')
                .send(params);

            expect(response.status).toBe(404);
        });

        it('should fail if rollenart is invalid', async () => {
            const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
            const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
            const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                {
                    organisation: savedUserOrganisation,
                    rolle: { systemrechte: [], serviceProviderIds: [] },
                },
            ];
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
            permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

            const organisation: OrganisationEntity = new OrganisationEntity();
            await em.persistAndFlush(organisation);

            const params: CreateRolleBodyParams = {
                name: faker.person.jobTitle(),
                administeredBySchulstrukturknoten: organisation.id,
                rollenart: 'INVALID' as RollenArt,
                merkmale: [faker.helpers.enumValue(RollenMerkmal)],
                systemrechte: [faker.helpers.enumValue(RollenSystemRechtEnum)],
            };

            const response: Response = await request(app.getHttpServer() as App)
                .post('/rolle')
                .send(params);

            expect(response.status).toBe(400);
        });

        it('should fail if merkmal is invalid', async () => {
            const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
            const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
            const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                {
                    organisation: savedUserOrganisation,
                    rolle: { systemrechte: [], serviceProviderIds: [] },
                },
            ];
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
            permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

            const organisation: OrganisationEntity = new OrganisationEntity();
            await em.persistAndFlush(organisation);

            const params: CreateRolleBodyParams = {
                name: faker.person.jobTitle(),
                administeredBySchulstrukturknoten: organisation.id,
                rollenart: faker.helpers.enumValue(RollenArt),
                merkmale: ['INVALID' as RollenMerkmal],
                systemrechte: [faker.helpers.enumValue(RollenSystemRechtEnum)],
            };

            const response: Response = await request(app.getHttpServer() as App)
                .post('/rolle')
                .send(params);

            expect(response.status).toBe(400);
        });

        it('should fail if merkmale are not unique', async () => {
            const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
            const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
            const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                {
                    organisation: savedUserOrganisation,
                    rolle: { systemrechte: [], serviceProviderIds: [] },
                },
            ];
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
            permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

            const organisation: OrganisationEntity = new OrganisationEntity();
            await em.persistAndFlush(organisation);

            const params: CreateRolleBodyParams = {
                name: faker.person.jobTitle(),
                administeredBySchulstrukturknoten: organisation.id,
                rollenart: faker.helpers.enumValue(RollenArt),
                merkmale: [RollenMerkmal.BEFRISTUNG_PFLICHT, RollenMerkmal.BEFRISTUNG_PFLICHT],
                systemrechte: [faker.helpers.enumValue(RollenSystemRechtEnum)],
            };

            const response: Response = await request(app.getHttpServer() as App)
                .post('/rolle')
                .send(params);

            expect(response.status).toBe(400);
        });

        it('should fail Rolle-Name-Unique-On-SSK specification is violated', async () => {
            const organisation: OrganisationEntity = new OrganisationEntity();
            await em.persistAndFlush(organisation);

            const rolleName: string = faker.person.jobTitle();
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    name: rolleName,
                }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            const params: CreateRolleBodyParams = {
                name: rolleName,
                administeredBySchulstrukturknoten: organisation.id,
                rollenart: faker.helpers.enumValue(RollenArt),
                merkmale: [],
                systemrechte: [],
            };

            const response: Response = await request(app.getHttpServer() as App)
                .post('/rolle')
                .send(params);
            const responseBody: DbiamRolleError = response.body as DbiamRolleError;

            expect(response.status).toBe(400);
            expect(responseBody.i18nKey).toStrictEqual('ROLLE_NAME_UNIQUE_ON_SSK');
            expect(responseBody.code).toStrictEqual(400);
        });
    });

    describe('/GET rollen', () => {
        it('should return all rollen', async () => {
            const orgaIds: string[] = (
                await Promise.all([
                    rolleRepo.save(DoFactory.createRolle(false)),
                    rolleRepo.save(DoFactory.createRolle(false)),
                    rolleRepo.save(DoFactory.createRolle(false)),
                ])
            ).map((r: Rolle<true> | DomainError) => {
                if (r instanceof DomainError) {
                    throw Error();
                }
                return r.administeredBySchulstrukturknoten;
            });

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds });

            const response: Response = await request(app.getHttpServer() as App)
                .get('/rolle')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            const pagedResponse: PagedResponse<RolleWithServiceProvidersResponse> =
                response.body as PagedResponse<RolleWithServiceProvidersResponse>;
            expect(pagedResponse.items).toHaveLength(3);
        });

        it('should return no rollen', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get('/rolle')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            const pagedResponse: PagedResponse<RolleWithServiceProvidersResponse> =
                response.body as PagedResponse<RolleWithServiceProvidersResponse>;
            expect(pagedResponse.items).toHaveLength(0);
        });

        it('should return rollen with the given queried name', async () => {
            const testRolle: { name: string; administeredBySchulstrukturknoten: string } | DomainError =
                await rolleRepo.save(DoFactory.createRolle(false));
            if (testRolle instanceof DomainError) {
                throw Error();
            }

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: [testRolle.administeredBySchulstrukturknoten],
            });

            const response: Response = await request(app.getHttpServer() as App)
                .get('/rolle')
                .query({ searchStr: testRolle.name })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            const pagedResponse: PagedResponse<RolleWithServiceProvidersResponse> =
                response.body as PagedResponse<RolleWithServiceProvidersResponse>;
            expect(pagedResponse.items).toHaveLength(1);
            expect(pagedResponse.items).toContainEqual(expect.objectContaining({ name: testRolle.name }));
        });

        it('should return rollen with serviceproviders', async () => {
            const [sp1, sp2, sp3]: [ServiceProvider<true>, ServiceProvider<true>, ServiceProvider<true>] =
                await Promise.all([
                    serviceProviderRepo.save(DoFactory.createServiceProvider(false)),
                    serviceProviderRepo.save(DoFactory.createServiceProvider(false)),
                    serviceProviderRepo.save(DoFactory.createServiceProvider(false)),
                ]);

            const orgaIds: string[] = (
                await Promise.all([
                    rolleRepo.save(DoFactory.createRolle(false, { serviceProviderIds: [sp1.id] })),
                    rolleRepo.save(DoFactory.createRolle(false, { serviceProviderIds: [sp2.id, sp3.id] })),
                    rolleRepo.save(DoFactory.createRolle(false)),
                ])
            ).map((r: Rolle<true> | DomainError) => {
                if (r instanceof DomainError) {
                    throw new Error();
                }
                return r.administeredBySchulstrukturknoten;
            });

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds });

            const response: Response = await request(app.getHttpServer() as App)
                .get('/rolle')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            const pagedResponse: PagedResponse<RolleWithServiceProvidersResponse> =
                response.body as PagedResponse<RolleWithServiceProvidersResponse>;
            expect(pagedResponse.items).toHaveLength(3);

            pagedResponse.items.forEach((item: RolleWithServiceProvidersResponse) => {
                item.serviceProviders.sort((a: ServiceProviderIdNameResponse, b: ServiceProviderIdNameResponse) =>
                    a.id.localeCompare(b.id),
                );
            });

            expect(pagedResponse.items).toContainEqual(
                expect.objectContaining({ serviceProviders: [{ id: sp1.id, name: sp1.name }] }),
            );
            expect(pagedResponse.items).toContainEqual(
                expect.objectContaining({
                    serviceProviders: [
                        { id: sp2.id, name: sp2.name },
                        { id: sp3.id, name: sp3.name },
                    ].sort(
                        (
                            a: {
                                id: string;
                                name: string;
                            },
                            b: {
                                id: string;
                                name: string;
                            },
                        ) => a.id.localeCompare(b.id),
                    ),
                }),
            );
            expect(pagedResponse.items).toContainEqual(expect.objectContaining({ serviceProviders: [] }));
        });

        it('should not return technische rollen', async () => {
            const orgaIds: string[] = (
                await Promise.all([
                    rolleRepo.save(DoFactory.createRolle(false, { istTechnisch: true })),
                    rolleRepo.save(DoFactory.createRolle(false, { istTechnisch: false })),
                    rolleRepo.save(DoFactory.createRolle(false, { istTechnisch: false })),
                ])
            ).map((r: Rolle<true> | DomainError) => {
                if (r instanceof DomainError) {
                    throw Error();
                }
                return r.administeredBySchulstrukturknoten;
            });

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds });

            const response: Response = await request(app.getHttpServer() as App)
                .get('/rolle')
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            const pagedResponse: PagedResponse<RolleWithServiceProvidersResponse> =
                response.body as PagedResponse<RolleWithServiceProvidersResponse>;
            expect(pagedResponse.items).toHaveLength(2);
        });
    });

    describe('/GET rolle by id', () => {
        it('should return rolle', async () => {
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
            if (rolle instanceof DomainError) {
                throw Error();
            }

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: [rolle.administeredBySchulstrukturknoten],
            });

            const response: Response = await request(app.getHttpServer() as App)
                .get(`/rolle/${rolle.id}`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });

        it('should return rolle with serviceproviders', async () => {
            const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false),
            );
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, { serviceProviderIds: [serviceProvider.id] }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: [rolle.administeredBySchulstrukturknoten],
            });

            const response: Response = await request(app.getHttpServer() as App)
                .get(`/rolle/${rolle.id}`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
            const responseBody: RolleWithServiceProvidersResponse = response.body as RolleWithServiceProvidersResponse;

            expect(responseBody?.serviceProviders).toContainEqual(
                expect.objectContaining({ id: serviceProvider.id, name: serviceProvider.name }),
            );
        });

        it('should return 404 when rolle could not be found', async () => {
            await rolleRepo.save(DoFactory.createRolle(false));
            const response: Response = await request(app.getHttpServer() as App)
                .get(`/rolle/${faker.string.uuid()}`)
                .send();

            expect(response.status).toBe(404);
            expect(response.body).toBeInstanceOf(Object);
        });

        it('should return 404 when rolle is technical', async () => {
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, { istTechnisch: true }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({
                all: false,
                orgaIds: [rolle.administeredBySchulstrukturknoten],
            });

            const response: Response = await request(app.getHttpServer() as App)
                .get(`/rolle/${rolle.id}`)
                .send();

            expect(response.status).toBe(404);
            expect(response.body).toBeInstanceOf(Object);
        });
    });

    describe('/PATCH rolle, add systemrecht', () => {
        describe('when rolle exists and systemrecht is matching enum', () => {
            it('should return 200', async () => {
                const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                const params: AddSystemrechtBodyParams = {
                    systemRecht: RollenSystemRechtEnum.ROLLEN_VERWALTEN,
                };
                const response: Response = await request(app.getHttpServer() as App)
                    .patch(`/rolle/${rolle.id}`)
                    .send(params);

                expect(response.status).toBe(200);
            });
        });

        describe('when rolle does not exist', () => {
            it('should return 500', async () => {
                await rolleRepo.save(DoFactory.createRolle(false));
                const validButNonExistingUUID: string = faker.string.uuid();
                const params: AddSystemrechtBodyParams = {
                    systemRecht: RollenSystemRechtEnum.ROLLEN_VERWALTEN,
                };
                const response: Response = await request(app.getHttpServer() as App)
                    .patch(`/rolle/${validButNonExistingUUID}`)
                    .send(params);

                expect(response.status).toBe(500);
            });
        });
    });

    describe('/GET rolleId/serviceProviders', () => {
        describe('when rolle exists', () => {
            it('should return 200 and a list of serviceProviders', async () => {
                const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                    DoFactory.createServiceProvider(false),
                );
                const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, { serviceProviderIds: [serviceProvider.id] }),
                );
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/rolle/${rolle.id}/serviceProviders`)
                    .send();

                expect(response.status).toBe(200);
            });
        });

        describe('when rolle does not exist', () => {
            it('should return 404', async () => {
                const validButNonExistingUUID: string = faker.string.uuid();
                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/rolle/${validButNonExistingUUID}/serviceProviders`)
                    .send();

                expect(response.status).toBe(404);
            });
        });
    });

    describe('/PUT rolleId/serviceProviders', () => {
        describe('when rolle and serviceProvider exist', () => {
            it('should return 201 and add serviceProvider', async () => {
                const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                    DoFactory.createServiceProvider(false),
                );
                const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                const params: RolleServiceProviderBodyParams = {
                    serviceProviderIds: [serviceProvider.id],
                    version: 1,
                };
                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/rolle/${rolle.id}/serviceProviders`)
                    .send(params);

                expect(response.status).toBe(201);
            });
        });

        describe('when rolle and serviceProvider exist, but serviceProvider is already attached', () => {
            it('should return 201', async () => {
                const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                    DoFactory.createServiceProvider(false),
                );
                const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, { serviceProviderIds: [serviceProvider.id] }),
                );
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                const params: RolleServiceProviderBodyParams = {
                    serviceProviderIds: [serviceProvider.id],
                    version: 1,
                };
                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/rolle/${rolle.id}/serviceProviders`)
                    .send(params);

                expect(response.status).toBe(201);
            });
        });

        describe('when rolle does not exist', () => {
            it('should return 404', async () => {
                const validButNonExistingUUID: string = faker.string.uuid();
                const params: RolleServiceProviderBodyParams = {
                    serviceProviderIds: [faker.string.uuid()],
                    version: 1,
                };
                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/rolle/${validButNonExistingUUID}/serviceProviders`)
                    .send(params);

                expect(response.status).toBe(404);
            });
        });

        describe('when serviceProvider does not exist', () => {
            it('should return 404', async () => {
                const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                const params: RolleServiceProviderBodyParams = {
                    serviceProviderIds: [faker.string.uuid()],
                    version: 1,
                };
                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/rolle/${rolle.id}/serviceProviders`)
                    .send(params);

                expect(response.status).toBe(404);
            });
        });
    });

    describe('/DELETE rolleId/serviceProviders', () => {
        describe('when rolle and serviceProvider exist', () => {
            it('should return 200 and delete serviceProvider', async () => {
                const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                    DoFactory.createServiceProvider(false),
                );
                const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, { serviceProviderIds: [serviceProvider.id] }),
                );
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                const params: RolleServiceProviderBodyParams = {
                    serviceProviderIds: [serviceProvider.id],
                    version: 1,
                };
                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/rolle/${rolle.id}/serviceProviders`)
                    .send(params);

                expect(response.status).toBe(200);
            });
        });

        describe('when rolle does not exist', () => {
            it('should return 404', async () => {
                const validButNonExistingUUID: string = faker.string.uuid();
                const params: RolleServiceProviderBodyParams = {
                    serviceProviderIds: [faker.string.uuid()],
                    version: 1,
                };
                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/rolle/${validButNonExistingUUID}/serviceProviders`)
                    .send(params);

                expect(response.status).toBe(404);
            });
        });

        describe('when serviceProvider does not exist', () => {
            it('should return 500', async () => {
                const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                if (rolle instanceof DomainError) {
                    throw Error();
                }
                const nonExistingServiceProviderId: string = faker.string.uuid();

                const params: RolleServiceProviderBodyParams = {
                    serviceProviderIds: [nonExistingServiceProviderId],
                    version: 1,
                };
                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/rolle/${rolle.id}/serviceProviders`)
                    .send(params);

                expect(response.status).toBe(404);
            });
        });
    });

    describe('GET systemrechte', () => {
        it('should return all systemrechte', async () => {
            const response: Response = await request(app.getHttpServer() as App).get('/rolle/systemrechte');
            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                RollenSystemRecht.ALL.map((sr: RollenSystemRecht) => new SystemRechtResponse(sr)),
            );
        });
    });

    describe('/PUT rolle', () => {
        it('should return updated rolle', async () => {
            const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
            const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
            const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                {
                    organisation: savedUserOrganisation,
                    rolle: { systemrechte: [], serviceProviderIds: [] },
                },
            ];
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
            permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

            const organisation: OrganisationEntity = new OrganisationEntity();
            await em.persistAndFlush(organisation);
            await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LEHR,
                }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [organisation.id] });

            const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false),
            );

            const params: UpdateRolleBodyParams = {
                name: faker.person.jobTitle(),
                merkmale: [faker.helpers.enumValue(RollenMerkmal)],
                systemrechte: [RollenSystemRechtEnum.ROLLEN_ERWEITERN],
                serviceProviderIds: [serviceProvider.id],
                version: 1,
            };

            const response: Response = await request(app.getHttpServer() as App)
                .put(`/rolle/${rolle.id}`)
                .send(params);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                id: rolle.id,
                name: params.name,
                administeredBySchulstrukturknoten: organisation.id,
                rollenart: rolle.rollenart,
                merkmale: params.merkmale,
                systemrechte: [new SystemRechtResponse(RollenSystemRecht.ROLLEN_ERWEITERN)],
            });
        });

        it('should fail if the rolle does not exist', async () => {
            const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
            const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
            const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                {
                    organisation: savedUserOrganisation,
                    rolle: { systemrechte: [], serviceProviderIds: [] },
                },
            ];
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
            permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

            const params: UpdateRolleBodyParams = {
                name: faker.person.jobTitle(),
                merkmale: [faker.helpers.enumValue(RollenMerkmal)],
                systemrechte: [faker.helpers.enumValue(RollenSystemRechtEnum)],
                serviceProviderIds: [],
                version: 1,
            };

            const response: Response = await request(app.getHttpServer() as App)
                .put(`/rolle/${faker.string.uuid()}`)
                .send(params);

            expect(response.status).toBe(404);
        });

        it('should return error with status-code 404 if user does NOT have permissions', async () => {
            const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
            const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
            const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                {
                    organisation: savedUserOrganisation,
                    rolle: { systemrechte: [], serviceProviderIds: [] },
                },
            ];

            const organisation: OrganisationEntity = new OrganisationEntity();
            await em.persistAndFlush(organisation);
            await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LEHR,
                }),
            );

            if (rolle instanceof DomainError) {
                throw Error();
            }

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: false, orgaIds: [] });
            permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);

            const params: UpdateRolleBodyParams = {
                name: faker.person.jobTitle(),
                merkmale: [faker.helpers.enumValue(RollenMerkmal)],
                systemrechte: [faker.helpers.enumValue(RollenSystemRechtEnum)],
                serviceProviderIds: [],
                version: 1,
            };

            const response: Response = await request(app.getHttpServer() as App)
                .put(`/rolle/${rolle.id}`)
                .send(params);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                code: 404,
                subcode: '01',
                titel: 'Angefragte Entität existiert nicht',
                beschreibung: 'Die angeforderte Entität existiert nicht',
            });
        });

        it('should return error with status-code 404 if rolle is technical', async () => {
            const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
            const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
            const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                {
                    organisation: savedUserOrganisation,
                    rolle: { systemrechte: [], serviceProviderIds: [] },
                },
            ];

            const organisation: OrganisationEntity = new OrganisationEntity();
            await em.persistAndFlush(organisation);
            await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LEHR,
                    istTechnisch: true,
                }),
            );

            if (rolle instanceof DomainError) {
                throw Error();
            }

            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({ all: false, orgaIds: [organisation.id] });
            permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);

            const params: UpdateRolleBodyParams = {
                name: faker.person.jobTitle(),
                merkmale: [faker.helpers.enumValue(RollenMerkmal)],
                systemrechte: [faker.helpers.enumValue(RollenSystemRechtEnum)],
                serviceProviderIds: [],
                version: 1,
            };

            const response: Response = await request(app.getHttpServer() as App)
                .put(`/rolle/${rolle.id}`)
                .send(params);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                code: 404,
                subcode: '01',
                titel: 'Angefragte Entität existiert nicht',
                beschreibung: 'Die angeforderte Entität existiert nicht',
            });
        });

        describe('Update Merkmale', () => {
            it('should return 400 if rolle is already assigned', async () => {
                const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
                const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
                const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                    {
                        organisation: savedUserOrganisation,
                        rolle: { systemrechte: [], serviceProviderIds: [] },
                    },
                ];

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
                organisation.typ = OrganisationsTyp.SCHULE;
                await em.persistAndFlush(organisation);
                await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

                const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, {
                        administeredBySchulstrukturknoten: organisation.id,
                        rollenart: RollenArt.LEHR,
                        istTechnisch: false,
                        merkmale: [],
                    }),
                );
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                await dBiamPersonenkontextRepoInternal.save(
                    DoFactory.createPersonenkontext(false, {
                        personId: person.id,
                        rolleId: rolle.id,
                        organisationId: organisation.id,
                    }),
                );

                personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
                permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [organisation.id] });
                permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

                const params: UpdateRolleBodyParams = {
                    name: faker.person.jobTitle(),
                    merkmale: [faker.helpers.enumValue(RollenMerkmal)],
                    systemrechte: [faker.helpers.enumValue(RollenSystemRechtEnum)],
                    serviceProviderIds: [],
                    version: 1,
                };

                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/rolle/${rolle.id}`)
                    .send(params);

                expect(response.status).toBe(400);
                expect(response.body).toEqual({
                    code: 400,
                    i18nKey: 'UPDATE_MERKMALE_ERROR',
                });
            });
        });

        it('should return error if new name has trailing space', async () => {
            const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
            const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
            const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                {
                    organisation: savedUserOrganisation,
                    rolle: { systemrechte: [], serviceProviderIds: [] },
                },
            ];

            const organisation: OrganisationEntity = new OrganisationEntity();
            await em.persistAndFlush(organisation);

            await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LEHR,
                }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                DoFactory.createServiceProvider(false),
            );

            const params: UpdateRolleBodyParams = {
                name: ' newName ',
                merkmale: [faker.helpers.enumValue(RollenMerkmal)],
                systemrechte: [faker.helpers.enumValue(RollenSystemRechtEnum)],
                serviceProviderIds: [serviceProvider.id],
                version: 1,
            };

            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
            permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [organisation.id] });
            permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

            const response: Response = await request(app.getHttpServer() as App)
                .put(`/rolle/${rolle.id}`)
                .send(params);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                code: 400,
                i18nKey: 'ROLLENNAME_ENTHAELT_LEERZEICHEN',
            });
        });
    });

    describe('/DELETE rolleId', () => {
        describe('should return error', () => {
            it('if rolle does NOT exist', async () => {
                const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
                const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
                const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                    {
                        organisation: savedUserOrganisation,
                        rolle: { systemrechte: [], serviceProviderIds: [] },
                    },
                ];
                personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
                permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValue({ all: false, orgaIds: [] });
                permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/rolle/${faker.string.uuid()}`)
                    .send();

                expect(response.status).toBe(404);
            });

            it('if rolle is already assigned to a Personenkontext', async () => {
                const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
                const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
                const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                    {
                        organisation: savedUserOrganisation,
                        rolle: { systemrechte: [], serviceProviderIds: [] },
                    },
                ];

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
                organisation.typ = OrganisationsTyp.SCHULE;
                await em.persistAndFlush(organisation);
                await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

                const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, {
                        administeredBySchulstrukturknoten: organisation.id,
                        rollenart: RollenArt.LEHR,
                    }),
                );
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                await dBiamPersonenkontextRepoInternal.save(
                    DoFactory.createPersonenkontext(false, {
                        personId: person.id,
                        rolleId: rolle.id,
                        organisationId: organisation.id,
                    }),
                );

                permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({
                    all: false,
                    orgaIds: [organisation.id],
                });
                permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

                personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/rolle/${rolle.id}`)
                    .send();

                expect(response.status).toBe(400);
                expect(response.body).toEqual({
                    code: 400,
                    i18nKey: 'ROLLE_HAT_PERSONENKONTEXTE_ERROR',
                });
            });

            it('if user does NOT have permissions', async () => {
                const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
                const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
                const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                    {
                        organisation: savedUserOrganisation,
                        rolle: { systemrechte: [], serviceProviderIds: [] },
                    },
                ];

                const organisation: OrganisationEntity = new OrganisationEntity();
                await em.persistAndFlush(organisation);
                await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

                const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, {
                        administeredBySchulstrukturknoten: organisation.id,
                        rollenart: RollenArt.LEHR,
                    }),
                );
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({
                    all: false,
                    orgaIds: [],
                });
                permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

                personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/rolle/${rolle.id}`)
                    .send();

                expect(response.status).toBe(404);
                expect(response.body).toEqual({
                    code: 404,
                    subcode: '01',
                    titel: 'Angefragte Entität existiert nicht',
                    beschreibung: 'Die angeforderte Entität existiert nicht',
                });
            });

            it('if rolle is technical', async () => {
                const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
                const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
                const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                    {
                        organisation: savedUserOrganisation,
                        rolle: { systemrechte: [], serviceProviderIds: [] },
                    },
                ];

                const organisation: OrganisationEntity = new OrganisationEntity();
                await em.persistAndFlush(organisation);
                await em.findOneOrFail(OrganisationEntity, { id: organisation.id });

                const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, {
                        administeredBySchulstrukturknoten: organisation.id,
                        rollenart: RollenArt.LEHR,
                        istTechnisch: true,
                    }),
                );
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({
                    all: false,
                    orgaIds: [organisation.id],
                });
                permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

                personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/rolle/${rolle.id}`)
                    .send();

                expect(response.status).toBe(404);
                expect(response.body).toEqual({
                    code: 404,
                    subcode: '01',
                    titel: 'Angefragte Entität existiert nicht',
                    beschreibung: 'Die angeforderte Entität existiert nicht',
                });
            });
        });

        describe('should succeed', () => {
            it('if all conditions are passed', async () => {
                const userOrganisation: Organisation<false> = DoFactory.createOrganisation(false);
                const savedUserOrganisation: Organisation<true> = await organisationRepo.save(userOrganisation);
                const personenkontextewithRolesMock: PersonenkontextRolleWithOrganisation[] = [
                    {
                        organisation: savedUserOrganisation,
                        rolle: { systemrechte: [], serviceProviderIds: [] },
                    },
                ];

                const organisation: OrganisationEntity = new OrganisationEntity();
                await em.persistAndFlush(organisation);
                await em.findOneOrFail(OrganisationEntity, { id: organisation.id });
                const serviceProvider: ServiceProvider<true> = await serviceProviderRepo.save(
                    DoFactory.createServiceProvider(false),
                );

                const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, {
                        administeredBySchulstrukturknoten: organisation.id,
                        rollenart: RollenArt.LEHR,
                        serviceProviderIds: [serviceProvider.id],
                        istTechnisch: false,
                    }),
                );
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                permissionsMock.getOrgIdsWithSystemrecht.mockResolvedValueOnce({
                    all: false,
                    orgaIds: [organisation.id],
                });
                permissionsMock.getPersonenkontexteWithRolesAndOrgs.mockResolvedValue(personenkontextewithRolesMock);

                personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/rolle/${rolle.id}`)
                    .send();

                expect(response.status).toBe(204);
            });
        });
    });
});
