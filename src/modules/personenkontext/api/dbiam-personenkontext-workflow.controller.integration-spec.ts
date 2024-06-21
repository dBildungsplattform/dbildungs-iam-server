import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { BadRequestException, CallHandler, ExecutionContext, INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';
import {
    ConfigTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DatabaseTestModule,
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/index.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonenKontextApiModule } from '../personenkontext-api.module.js';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Observable } from 'rxjs';
import { PassportUser } from '../../authentication/types/user.js';
import { Request } from 'express';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { FindRollenResponse } from './response/find-rollen.response.js';
import { DbiamPersonenkontextFactory } from '../domain/dbiam-personenkontext.factory.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { PersonenkontextFactory } from '../domain/personenkontext.factory.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonModule } from '../../person/person.module.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DbiamUpdatePersonenkontexteBodyParams } from './param/dbiam-update-personenkontexte.body.params.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { PersonenkontexteUpdateError } from '../domain/error/personenkontexte-update.error.js';
import { DBiamFindPersonenkontexteByPersonIdParams } from './param/dbiam-find-personenkontext-by-personid.params.js';
import { PersonenkontextWorkflowAggregate } from '../domain/personenkontext-workflow.js';
import { PersonenkontextWorkflowFactory } from '../domain/personenkontext-workflow.factory.js';
import { DbiamPersonenkontextWorkflowController } from './dbiam-personenkontext-workflow.controller.js';

function createRolle(this: void, rolleFactory: RolleFactory, params: Partial<Rolle<boolean>> = {}): Rolle<false> {
    const rolle: Rolle<false> = rolleFactory.createNew(
        faker.string.alpha(),
        faker.string.uuid(),
        faker.helpers.enumValue(RollenArt),
        [faker.helpers.enumValue(RollenMerkmal)],
        [faker.helpers.enumValue(RollenSystemRecht)],
        [],
    );
    Object.assign(rolle, params);

    return rolle;
}

function createPersonenkontext<WasPersisted extends boolean>(
    this: void,
    personenkontextFactory: PersonenkontextFactory,
    withId: WasPersisted,
    params: Partial<Personenkontext<boolean>> = {},
): Personenkontext<WasPersisted> {
    const personenkontext: Personenkontext<WasPersisted> = personenkontextFactory.construct<boolean>(
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

describe('DbiamPersonenkontextWorkflowController Integration Test', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let organisationRepo: OrganisationRepo;
    let rolleRepo: RolleRepo;
    let rolleFactory: RolleFactory;
    let personpermissionsRepoMock: DeepMocked<PersonPermissionsRepo>;
    let personRepo: PersonRepo;
    let personenkontextRepo: DBiamPersonenkontextRepo;
    let personenkontextFactory: PersonenkontextFactory;
    let personenkontextWorkflowMock: DeepMocked<PersonenkontextWorkflowAggregate>;
    let controller: DbiamPersonenkontextWorkflowController;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MapperTestModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                PersonenKontextApiModule,
                PersonModule,
            ],
            providers: [
                RolleFactory,
                OrganisationRepository,
                ServiceProviderRepo,
                DbiamPersonenkontextFactory,
                PersonenkontextFactory,
                DBiamPersonenkontextRepo,
                PersonRepository,
                RolleRepo,
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: PersonPermissionsRepo,
                    useValue: createMock<PersonPermissionsRepo>(),
                },
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>(),
                },
                {
                    provide: PersonenkontextWorkflowFactory,
                    useValue: createMock<PersonenkontextWorkflowFactory>(),
                },
                {
                    provide: APP_INTERCEPTOR,
                    useValue: {
                        intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
                            const req: Request = context.switchToHttp().getRequest();
                            req.passportUser = createMock<PassportUser>({
                                async personPermissions() {
                                    return personpermissionsRepoMock.loadPersonPermissions('');
                                },
                            });
                            return next.handle();
                        },
                    },
                },
            ],
        }).compile();

        orm = module.get(MikroORM);
        organisationRepo = module.get(OrganisationRepo);
        rolleRepo = module.get(RolleRepo);
        rolleFactory = module.get(RolleFactory);
        personpermissionsRepoMock = module.get(PersonPermissionsRepo);
        personRepo = module.get(PersonRepo);
        personenkontextRepo = module.get(DBiamPersonenkontextRepo);
        personenkontextFactory = module.get(PersonenkontextFactory);
        personenkontextWorkflowMock = createMock<PersonenkontextWorkflowAggregate>();
        controller = module.get<DbiamPersonenkontextWorkflowController>(DbiamPersonenkontextWorkflowController);

        await DatabaseTestModule.setupDatabase(orm);
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
        personenkontextWorkflowMock = createMock<PersonenkontextWorkflowAggregate>();
    });

    describe('/GET step for personenkontext', () => {
        it('should return selected organisation and all rollen', async () => {
            const organisationName: string = faker.company.name();
            const organisation: OrganisationDo<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { name: organisationName }),
            );

            const rolleName: string = faker.string.alpha({ length: 10 });
            await rolleRepo.save(
                createRolle(rolleFactory, {
                    name: rolleName,
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LERN,
                }),
            );

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisation.id]);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/personenkontext/step')
                .query({ organisationId: organisation.id })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });

        it('should return organisations and empty roles if organisationId is provided but no roles are found', async () => {
            const organisationName: string = faker.company.name();
            const organisation: OrganisationDo<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { name: organisationName }),
            );

            const response: Response = await request(app.getHttpServer() as App)
                .get('/personenkontext/step')
                .query({ organisationId: organisation.id })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });
        describe('/PUT commit', () => {
            describe('when sending no PKs', () => {
                it('should delete and therefore return 200', async () => {
                    const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
                    const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
                    const savedPK: Personenkontext<true> = await personenkontextRepo.save(
                        createPersonenkontext(personenkontextFactory, false, {
                            personId: person.id,
                            rolleId: rolle.id,
                        }),
                    );
                    const updatePKsRequest: DbiamUpdatePersonenkontexteBodyParams =
                        createMock<DbiamUpdatePersonenkontexteBodyParams>({
                            count: 1,
                            lastModified: savedPK.updatedAt,
                            personenkontexte: [],
                        });

                    const response: Response = await request(app.getHttpServer() as App)
                        .put(`/personenkontext/${person.id}`)
                        .send(updatePKsRequest);

                    expect(response.status).toBe(200);
                });
            });

            describe('when errors occur', () => {
                it('should return error because the count is not matching', async () => {
                    const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
                    const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
                    const savedPK: Personenkontext<true> = await personenkontextRepo.save(
                        createPersonenkontext(personenkontextFactory, false, {
                            personId: person.id,
                            rolleId: rolle.id,
                        }),
                    );
                    const updatePKsRequest: DbiamUpdatePersonenkontexteBodyParams =
                        createMock<DbiamUpdatePersonenkontexteBodyParams>({
                            count: 0,
                            lastModified: savedPK.updatedAt,
                            personenkontexte: [],
                        });

                    const response: Response = await request(app.getHttpServer() as App)
                        .put(`/personenkontext/${person.id}`)
                        .send(updatePKsRequest);

                    expect(response.status).toBe(400);
                });
                it('should throw BadRequestException if updateResult is an instance of PersonenkontexteUpdateError', async () => {
                    const params: DBiamFindPersonenkontexteByPersonIdParams = { personId: faker.string.uuid() };
                    const bodyParams: DbiamUpdatePersonenkontexteBodyParams = {
                        count: 1,
                        lastModified: new Date(),
                        personenkontexte: [],
                    };
                    const updateError: PersonenkontexteUpdateError = new PersonenkontexteUpdateError(
                        'Update error message',
                    );
                    personenkontextWorkflowMock.commit.mockResolvedValue(updateError);

                    await expect(controller.commit(params, bodyParams)).rejects.toThrow(BadRequestException);
                    await expect(controller.commit(params, bodyParams)).rejects.toThrow(
                        'Personenkontexte could not be updated because current count and count of the request are not matching',
                    );
                });
                it('should rethrow generic errors', async () => {
                    const params: DBiamFindPersonenkontexteByPersonIdParams = { personId: faker.string.uuid() };
                    const bodyParams: DbiamUpdatePersonenkontexteBodyParams = {
                        count: 1,
                        lastModified: new Date(),
                        personenkontexte: [],
                    };
                    const genericError: Error = new Error('Generic error message');
                    personenkontextWorkflowMock.commit.mockRejectedValue(genericError);

                    await expect(controller.commit(params, bodyParams)).rejects.toThrow(Error);
                });
            });
        });

        describe('/GET rollen for personenkontext', () => {
            it('should return all rollen for a personenkontext without filter, if the user is Landesadmin', async () => {
                const rolleName: string = faker.string.alpha({ length: 10 });
                await rolleRepo.save(createRolle(rolleFactory, { name: rolleName, rollenart: RollenArt.SYSADMIN }));
                const schuladminRolleName: string = faker.string.alpha({ length: 10 });
                await rolleRepo.save(
                    createRolle(rolleFactory, { name: schuladminRolleName, rollenart: RollenArt.LEIT }),
                );

                const personpermissions: DeepMocked<PersonPermissions> = createMock();
                personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([
                    organisationRepo.ROOT_ORGANISATION_ID,
                ]);
                personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);

                const response: Response = await request(app.getHttpServer() as App)
                    .get('/personenkontext/rollen')
                    .send();

                expect(response.status).toBe(200);
                expect(response.body).toBeInstanceOf(Object);
                expect(response.body).toEqual(
                    expect.objectContaining({
                        total: 2,
                    }) as FindRollenResponse,
                );
            });

            it('should return all rollen for a personenkontext based on PersonenkontextAnlage', async () => {
                const rolleName: string = faker.string.alpha({ length: 10 });
                await rolleRepo.save(createRolle(rolleFactory, { name: rolleName }));
                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/personenkontext/rollen?rolleName=${rolleName}&limit=25`)
                    .send();

                expect(response.status).toBe(200);
                expect(response.body).toBeInstanceOf(Object);
            });

            it('should return empty list', async () => {
                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/personenkontext/rollen?rolleName=${faker.string.alpha()}&limit=25`)
                    .send();

                expect(response.status).toBe(200);
                expect(response.body).toBeInstanceOf(Object);
            });
        });

        describe('/GET schulstrukturknoten for personenkontext', () => {
            it('should return all schulstrukturknoten for a personenkontext based on PersonenkontextAnlage', async () => {
                const rolleName: string = faker.string.alpha({ length: 10 });
                const sskName: string = faker.company.name();
                const rolle: Rolle<true> = await rolleRepo.save(createRolle(rolleFactory, { name: rolleName }));
                const rolleId: string = rolle.id;
                await organisationRepo.save(DoFactory.createOrganisation(false, { name: sskName }));

                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/personenkontext/schulstrukturknoten?rolleId=${rolleId}&sskName=${sskName}&limit=25`)
                    .send();

                expect(response.status).toBe(200);
                expect(response.body).toBeInstanceOf(Object);
            });

            it('should return all schulstrukturknoten for a personenkontext based on PersonenkontextAnlage even when no sskName is provided', async () => {
                const rolleName: string = faker.string.alpha({ length: 10 });
                const sskName: string = faker.company.name();
                const rolle: Rolle<true> = await rolleRepo.save(createRolle(rolleFactory, { name: rolleName }));
                const rolleId: string = rolle.id;
                await organisationRepo.save(DoFactory.createOrganisation(false, { name: sskName }));

                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/personenkontext/schulstrukturknoten?rolleId=${rolleId}&limit=25`)
                    .send();

                expect(response.status).toBe(200);
                expect(response.body).toBeInstanceOf(Object);
            });

            it('should return empty list', async () => {
                const response: Response = await request(app.getHttpServer() as App)
                    .get(
                        `/personenkontext/schulstrukturknoten?rolleId=${faker.string.uuid()}&sskName=${faker.string.alpha()}&limit=25`,
                    )
                    .send();

                expect(response.status).toBe(200);
                expect(response.body).toBeInstanceOf(Object);
            });

            it('should return empty list even when no sskName is provided', async () => {
                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/personenkontext/schulstrukturknoten?rolleId=${faker.string.uuid()}&limit=25`)
                    .send();

                expect(response.status).toBe(200);
                expect(response.body).toBeInstanceOf(Object);
            });
        });
    });
});
