import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { CallHandler, ExecutionContext, INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DoFactory,
    KeycloakConfigTestModule,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/index.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonenKontextApiModule } from '../personenkontext-api.module.js';
import { RollenArt, RollenMerkmal, RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Observable } from 'rxjs';
import { PassportUser } from '../../authentication/types/user.js';
import { Request } from 'express';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { FindRollenResponse } from './response/find-rollen.response.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { PersonenkontextFactory } from '../domain/personenkontext.factory.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DbiamUpdatePersonenkontexteBodyParams } from './param/dbiam-update-personenkontexte.body.params.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { PersonenkontexteUpdateError } from '../domain/error/personenkontexte-update.error.js';
import { DBiamFindPersonenkontexteByPersonIdParams } from './param/dbiam-find-personenkontext-by-personid.params.js';
import { PersonenkontextWorkflowAggregate } from '../domain/personenkontext-workflow.js';
import { PersonenkontextWorkflowFactory } from '../domain/personenkontext-workflow.factory.js';
import { FindDbiamPersonenkontextWorkflowBodyParams } from './param/dbiam-find-personenkontextworkflow-body.params.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { KeycloakAdministrationModule } from '../../keycloak-administration/keycloak-administration.module.js';
import { KeycloakConfigModule } from '../../keycloak-administration/keycloak-config.module.js';

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
    let personenkontextWorkflowFactoryMock: DeepMocked<PersonenkontextWorkflowFactory>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MapperTestModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                PersonenKontextApiModule,
                KeycloakAdministrationModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: PersonPermissionsRepo,
                    useValue: createMock<PersonPermissionsRepo>(),
                },
                {
                    provide: PersonenkontextWorkflowFactory,
                    useValue: createMock<PersonenkontextWorkflowFactory>(),
                },
                {
                    provide: PersonenkontextWorkflowAggregate,
                    useValue: createMock<PersonenkontextWorkflowAggregate>(),
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
        })
            .overrideModule(KeycloakConfigModule)
            .useModule(KeycloakConfigTestModule.forRoot({ isKeycloakRequired: true }))
            .compile();

        orm = module.get(MikroORM);
        organisationRepo = module.get(OrganisationRepo);
        rolleRepo = module.get(RolleRepo);
        rolleFactory = module.get(RolleFactory);
        personpermissionsRepoMock = module.get(PersonPermissionsRepo);
        personRepo = module.get(PersonRepo);
        personenkontextRepo = module.get(DBiamPersonenkontextRepo);
        personenkontextFactory = module.get(PersonenkontextFactory);
        personenkontextWorkflowMock = module.get(PersonenkontextWorkflowAggregate);
        personenkontextWorkflowFactoryMock = createMock<PersonenkontextWorkflowFactory>();

        await DatabaseTestModule.setupDatabase(orm);
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

    describe('/POST create person with personenkontext', () => {
        it('should return created person and personenkontext', async () => {
            const organisation: OrganisationDo<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolle: Rolle<true> = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LEHR,
                }),
            );

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.hasSystemrechtAtOrganisation.mockResolvedValue(true);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/personenkontext-workflow')
                .send({
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    organisationId: organisation.id,
                    rolleId: rolle.id,
                });
            expect(response.status).toBe(201);
        });

        it('should return error with status-code=404 if organisation does NOT exist', async () => {
            const rolle: Rolle<true> = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                }),
            );
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            permissions.hasSystemrechtAtOrganisation.mockResolvedValue(true);
            permissions.canModifyPerson.mockResolvedValueOnce(true);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissions);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/personenkontext-workflow')
                .send({
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    organisationId: faker.string.uuid(),
                    rolleId: rolle.id,
                });

            expect(response.status).toBe(404);
        });

        it('should return error with status-code 400 if specification ROLLE_NUR_AN_PASSENDE_ORGANISATION is NOT satisfied', async () => {
            const organisation: OrganisationDo<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolle: Rolle<true> = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.SYSADMIN,
                }),
            );

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.hasSystemrechtAtOrganisation.mockResolvedValue(true);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/personenkontext-workflow')
                .send({
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    organisationId: organisation.id,
                    rolleId: rolle.id,
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                code: 400,
                i18nKey: 'ROLLE_NUR_AN_PASSENDE_ORGANISATION',
            });
        });

        it('should return error with status-code 404 if user does NOT have permissions', async () => {
            const organisation: OrganisationDo<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolle: Rolle<true> = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LEHR,
                }),
            );

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.hasSystemrechteAtOrganisation.mockResolvedValueOnce(false);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/personenkontext-workflow')
                .send({
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    organisationId: organisation.id,
                    rolleId: rolle.id,
                });
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                code: 404,
                subcode: '01',
                titel: 'Angefragte Entität existiert nicht',
                beschreibung: 'Die angeforderte Entität existiert nicht',
            });
        });
    });

    describe('/GET processStep for personenkontext', () => {
        it('should return selected organisation and all rollen', async () => {
            const organisationName: string = faker.company.name();
            const organisation: OrganisationDo<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { name: organisationName }),
            );

            const rolleName: string = faker.string.alpha({ length: 10 });
            const rolle: Rolle<true> = await rolleRepo.save(
                createRolle(rolleFactory, {
                    name: rolleName,
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LERN,
                }),
            );

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);

            const anlageMock: DeepMocked<PersonenkontextWorkflowAggregate> =
                createMock<PersonenkontextWorkflowAggregate>({
                    findAllSchulstrukturknoten: jest.fn().mockResolvedValue([]),
                    findRollenForOrganisation: jest.fn().mockResolvedValue(rolle),
                });

            personenkontextWorkflowFactoryMock.createNew.mockReturnValue(anlageMock);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/personenkontext-workflow/step')
                .query({ organisationId: organisation.id })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });

        it('should handle request with no organisationId', async () => {
            const organisationName: string = faker.company.name();
            const randomName: string = faker.company.name();

            const organisation: OrganisationDo<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { name: organisationName }),
            );
            const organisations: OrganisationDo<true>[] = [organisation];

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisation.id]);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);
            personenkontextWorkflowMock.findAllSchulstrukturknoten.mockResolvedValue(organisations);

            const response: Response = await request(app.getHttpServer() as App)
                .get(`/personenkontext/step/organisationName?organisationName=${randomName}`)
                .send();

            expect(response.status).toEqual(404);
        });
        it('should call findAllSchulstrukturknoten when no organisationId is provided', async () => {
            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([faker.string.uuid()]);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);

            const anlageMock: DeepMocked<PersonenkontextWorkflowAggregate> =
                createMock<PersonenkontextWorkflowAggregate>({
                    findAllSchulstrukturknoten: jest.fn().mockResolvedValue('organisations'),
                });

            personenkontextWorkflowFactoryMock.createNew.mockReturnValue(anlageMock);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/personenkontext-workflow/step')
                .send();

            expect(response.status).toEqual(200);
        });

        it('should call findRollenForOrganisation when organisationId is provided', async () => {
            const organisation: OrganisationDo<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { name: faker.company.name() }),
            );

            const rolle: Rolle<true> = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LERN,
                }),
            );

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);

            const rollen: Rolle<true>[] = [rolle];

            const anlageMock: DeepMocked<PersonenkontextWorkflowAggregate> =
                createMock<PersonenkontextWorkflowAggregate>({
                    findRollenForOrganisation: jest.fn().mockResolvedValue(rollen),
                });

            personenkontextWorkflowFactoryMock.createNew.mockReturnValue(anlageMock);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/personenkontext-workflow/step')
                .query({ organisationId: organisation.id })
                .send();

            expect(response.status).toEqual(200);
        });

        it('should return empty organisations and empty roles if organisationId is provided but no roles nor orgas are found', async () => {
            const organisationName: string = faker.company.name();
            const organisation: OrganisationDo<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { name: organisationName }),
            );

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/personenkontext-workflow/step')
                .query({ organisationId: organisation.id })
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });

        it('should set canCommit to true if canCommit returns true', async () => {
            const organisationId: string = faker.string.uuid();
            // Create and save an organisation and a rolle
            const organisation: OrganisationDo<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { id: organisationId, typ: OrganisationsTyp.LAND }),
            );

            const rolle: Rolle<true> = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisationId,
                    rollenart: RollenArt.SYSADMIN,
                }),
            );
            const rolleId: string = rolle.id;

            organisationRepo.findById = jest.fn().mockResolvedValue(organisation);
            rolleRepo.findById = jest.fn().mockResolvedValue(rolle);

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);

            const params: FindDbiamPersonenkontextWorkflowBodyParams = {
                organisationId,
                rolleId,
                organisationName: undefined,
                rolleName: undefined,
                limit: undefined,
            };
            const rollen: Rolle<true>[] = [rolle];

            personenkontextWorkflowMock.findRollenForOrganisation.mockResolvedValue(rollen);
            personenkontextWorkflowMock.canCommit.mockResolvedValue(true);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/personenkontext-workflow/step')
                .query({ organisationId: params.organisationId, rolleId: params.rolleId })
                .send();

            expect(response.status).toEqual(200);
        });
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
                        updatedAt: new Date(),
                    }),
                );
                const updatePKsRequest: DbiamUpdatePersonenkontexteBodyParams =
                    createMock<DbiamUpdatePersonenkontexteBodyParams>({
                        count: 1,
                        lastModified: savedPK.updatedAt,
                        personenkontexte: [],
                    });

                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/personenkontext-workflow/${person.id}`)
                    .send(updatePKsRequest);

                expect(response.status).toBe(200);
            });
        });
        it('should throw BadRequestException if updateResult is an instance of PersonenkontexteUpdateError', async () => {
            const params: DBiamFindPersonenkontexteByPersonIdParams = { personId: faker.string.uuid() };
            const bodyParams: DbiamUpdatePersonenkontexteBodyParams = {
                count: 1,
                lastModified: new Date(),
                personenkontexte: [],
            };
            const updateError: PersonenkontexteUpdateError = new PersonenkontexteUpdateError('Update error message');
            personenkontextWorkflowMock.commit.mockResolvedValue(updateError);

            const response: Response = await request(app.getHttpServer() as App)
                .put(`/personenkontext-workflow/${params.personId}`)
                .send(bodyParams);

            expect(response.status).toBe(400);
        });

        describe('when errors occur', () => {
            it('should return error because the count is not matching', async () => {
                const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
                const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
                const savedPK: Personenkontext<true> = await personenkontextRepo.save(
                    createPersonenkontext(personenkontextFactory, false, {
                        personId: person.id,
                        rolleId: rolle.id,
                        updatedAt: new Date(),
                    }),
                );
                const updatePKsRequest: DbiamUpdatePersonenkontexteBodyParams =
                    createMock<DbiamUpdatePersonenkontexteBodyParams>({
                        count: 0,
                        lastModified: savedPK.updatedAt,
                        personenkontexte: [],
                    });

                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/personenkontext-workflow/${person.id}`)
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

                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/personenkontext-workflow/${params.personId}`)
                    .send(bodyParams);

                expect(response.status).toBe(400);
            });
            it('should rethrow generic errors', async () => {
                const params: DBiamFindPersonenkontexteByPersonIdParams = { personId: faker.string.uuid() };
                const bodyParams: DbiamUpdatePersonenkontexteBodyParams = {
                    count: 0,
                    lastModified: new Date(),
                    personenkontexte: [],
                };
                const genericError: Error = new Error('Generic error message');
                personenkontextWorkflowMock.commit.mockRejectedValue(genericError);

                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/personenkontext-workflow/${params.personId}`)
                    .send(bodyParams);

                expect(response.status).toBe(500);
            });
        });
    });

    describe('/GET rollen for personenkontext', () => {
        it('should return all rollen for a personenkontext without filter, if the user is Landesadmin', async () => {
            const rolleName: string = faker.string.alpha({ length: 10 });
            await rolleRepo.save(createRolle(rolleFactory, { name: rolleName, rollenart: RollenArt.SYSADMIN }));
            const schuladminRolleName: string = faker.string.alpha({ length: 10 });
            await rolleRepo.save(createRolle(rolleFactory, { name: schuladminRolleName, rollenart: RollenArt.LEIT }));

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisationRepo.ROOT_ORGANISATION_ID]);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);

            const response: Response = await request(app.getHttpServer() as App)
                .get('/personenkontext-workflow/rollen')
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
                .get(`/personenkontext-workflow/rollen?rolleName=${rolleName}&limit=25`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });

        it('should return empty list', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get(`/personenkontext-workflow/rollen?rolleName=${faker.string.alpha()}&limit=25`)
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
                .get(`/personenkontext-workflow/schulstrukturknoten?rolleId=${rolleId}&sskName=${sskName}&limit=25`)
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
                .get(`/personenkontext-workflow/schulstrukturknoten?rolleId=${rolleId}&limit=25`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });

        it('should return empty list', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get(
                    `/personenkontext-workflow/schulstrukturknoten?rolleId=${faker.string.uuid()}&sskName=${faker.string.alpha()}&limit=25`,
                )
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });

        it('should return empty list even when no sskName is provided', async () => {
            const response: Response = await request(app.getHttpServer() as App)
                .get(`/personenkontext-workflow/schulstrukturknoten?rolleId=${faker.string.uuid()}&limit=25`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Object);
        });
    });
});
