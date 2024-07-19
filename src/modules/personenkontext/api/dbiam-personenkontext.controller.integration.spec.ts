import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { CallHandler, ExecutionContext, INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { Observable } from 'rxjs';
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
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { PassportUser } from '../../authentication/types/user.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { PersonDo } from '../../person/domain/person.do.js';
import { PersonRepo } from '../../person/persistence/person.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonenkontextFactory } from '../domain/personenkontext.factory.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { PersonenKontextApiModule } from '../personenkontext-api.module.js';
import { KeycloakConfigModule } from '../../keycloak-administration/keycloak-config.module.js';
import { KeycloakAdministrationModule } from '../../keycloak-administration/keycloak-administration.module.js';

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

describe('dbiam Personenkontext API', () => {
    let app: INestApplication;
    let orm: MikroORM;

    let personenkontextRepo: DBiamPersonenkontextRepo;
    let personRepo: PersonRepo;
    let organisationRepo: OrganisationRepo;
    let rolleRepo: RolleRepo;
    let personenkontextFactory: PersonenkontextFactory;
    let personpermissionsRepoMock: DeepMocked<PersonPermissionsRepo>;

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
        personenkontextRepo = module.get(DBiamPersonenkontextRepo);
        personRepo = module.get(PersonRepo);
        organisationRepo = module.get(OrganisationRepo);
        rolleRepo = module.get(RolleRepo);
        personenkontextFactory = module.get(PersonenkontextFactory);
        personpermissionsRepoMock = module.get(PersonPermissionsRepo);

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

    describe('/GET personenkontexte for person', () => {
        it('should return all personenkontexte for the person', async () => {
            const rolleA: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
            const rolleB: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
            const rolleC: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));

            const personA: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
            const personB: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));

            const [pk1, pk2]: [Personenkontext<true>, Personenkontext<true>, Personenkontext<true>] = await Promise.all(
                [
                    personenkontextRepo.save(
                        createPersonenkontext(personenkontextFactory, false, {
                            personId: personA.id,
                            rolleId: rolleA.id,
                        }),
                    ),
                    personenkontextRepo.save(
                        createPersonenkontext(personenkontextFactory, false, {
                            personId: personA.id,
                            rolleId: rolleB.id,
                        }),
                    ),
                    personenkontextRepo.save(
                        createPersonenkontext(personenkontextFactory, false, {
                            personId: personB.id,
                            rolleId: rolleC.id,
                        }),
                    ),
                ],
            );

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([pk1.organisationId, pk2.organisationId]);

            const response: Response = await request(app.getHttpServer() as App)
                .get(`/dbiam/personenkontext/${personA.id}`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body).toHaveLength(2);
        });

        it('should return empty list', async () => {
            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);

            const response: Response = await request(app.getHttpServer() as App)
                .get(`/dbiam/personenkontext/${faker.string.uuid()}`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body).toHaveLength(0);
        });

        it('should return error when no results found and user is not admin', async () => {
            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);
            personpermissions.hasSystemrechtAtRootOrganisation.mockResolvedValueOnce(false);

            const response: Response = await request(app.getHttpServer() as App)
                .get(`/dbiam/personenkontext/${faker.string.uuid()}`)
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

    describe('/POST create personenkontext', () => {
        it('should return created personenkontext', async () => {
            const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
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
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisation.id]);
            personpermissions.hasSystemrechtAtRootOrganisation.mockResolvedValueOnce(true);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personenkontext')
                .send({ personId: person.id, organisationId: organisation.id, rolleId: rolle.id });

            expect(response.status).toBe(201);
        });

        it('should return created personenkontext when Klasse specifications are met', async () => {
            //create lehrer on Schule
            const lehrer: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
            const schuleDo: OrganisationDo<false> = DoFactory.createOrganisation(false, {
                typ: OrganisationsTyp.SCHULE,
            });
            const schule: OrganisationDo<true> = await organisationRepo.save(schuleDo);
            const schuelerRolleDummy: Rolle<false> = DoFactory.createRolle(false, {
                rollenart: RollenArt.LERN,
                administeredBySchulstrukturknoten: schule.id,
            });
            const schuelerRolle: Rolle<true> = await rolleRepo.save(schuelerRolleDummy);
            await personenkontextRepo.save(personenkontextFactory.createNew(lehrer.id, schule.id, schuelerRolle.id));

            const klasseDo: OrganisationDo<false> = DoFactory.createOrganisation(false, {
                typ: OrganisationsTyp.KLASSE,
                administriertVon: schule.id,
            });
            const klasse: OrganisationDo<true> = await organisationRepo.save(klasseDo);

            const personpermissions: DeepMocked<PersonPermissions> = createMock();
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([schule.id, klasse.id]);
            personpermissions.hasSystemrechtAtRootOrganisation.mockResolvedValueOnce(true);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personenkontext')
                .send({
                    personId: lehrer.id,
                    organisationId: klasse.id,
                    rolleId: schuelerRolle.id,
                });

            expect(response.status).toBe(201);
        });

        it('should return error if personenkontext already exists', async () => {
            const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
            const organisation: OrganisationDo<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolle: Rolle<true> = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LEHR,
                }),
            );
            const personenkontext: Personenkontext<true> = await personenkontextRepo.save(
                personenkontextFactory.createNew(person.id, organisation.id, rolle.id),
            );
            const permissions: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValueOnce(permissions);
            permissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);
            permissions.canModifyPerson.mockResolvedValueOnce(true);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personenkontext')
                .send({
                    personId: personenkontext.personId,
                    organisationId: personenkontext.organisationId,
                    rolleId: personenkontext.rolleId,
                });

            expect(response.status).toBe(400);
        });

        it('should return error if references do not exist', async () => {
            const personenkontext: Personenkontext<false> = createPersonenkontext(personenkontextFactory, false);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personenkontext')
                .send({
                    personId: personenkontext.personId,
                    organisationId: personenkontext.organisationId,
                    rolleId: personenkontext.rolleId,
                });

            expect(response.status).toBe(400); // TODO: Fix
        });

        describe('should return error if specifications are not satisfied', () => {
            it('when organisation is not found', async () => {
                const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
                const rolle: Rolle<true> = await rolleRepo.save(DoFactory.createRolle(false));
                const response: Response = await request(app.getHttpServer() as App)
                    .post('/dbiam/personenkontext')
                    .send({
                        personId: person.id,
                        organisationId: faker.string.uuid(),
                        rolleId: rolle.id,
                    });

                expect(response.status).toBe(400);
            });

            it('when rolle is not found', async () => {
                const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
                const organisation: OrganisationDo<true> = await organisationRepo.save(
                    DoFactory.createOrganisation(false),
                );
                const response: Response = await request(app.getHttpServer() as App)
                    .post('/dbiam/personenkontext')
                    .send({
                        personId: person.id,
                        organisationId: organisation.id,
                        rolleId: faker.string.uuid(),
                    });

                expect(response.status).toBe(404);
            });

            it('when rollenart of rolle is not LEHR or LERN', async () => {
                const orgaDo: OrganisationDo<false> = DoFactory.createOrganisation(false, {
                    typ: OrganisationsTyp.KLASSE,
                });
                const rolleDummy: Rolle<false> = DoFactory.createRolle(false, { rollenart: RollenArt.SYSADMIN });

                const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
                const organisation: OrganisationDo<true> = await organisationRepo.save(orgaDo);
                const rolle: Rolle<true> = await rolleRepo.save(rolleDummy);
                const response: Response = await request(app.getHttpServer() as App)
                    .post('/dbiam/personenkontext')
                    .send({
                        personId: person.id,
                        organisationId: organisation.id,
                        rolleId: rolle.id,
                    });

                expect(response.status).toBe(400);
            });

            it('when rollenart for Schule and Klasse are not equal', async () => {
                //create admin on Schule
                const admin: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
                const schuleDo: OrganisationDo<false> = DoFactory.createOrganisation(false, {
                    typ: OrganisationsTyp.SCHULE,
                });
                const adminRolleDummy: Rolle<false> = DoFactory.createRolle(false, { rollenart: RollenArt.ORGADMIN });

                const schule: OrganisationDo<true> = await organisationRepo.save(schuleDo);
                const adminRolle: Rolle<true> = await rolleRepo.save(adminRolleDummy);
                await personenkontextRepo.save(personenkontextFactory.createNew(admin.id, schule.id, adminRolle.id));

                const klasseDo: OrganisationDo<false> = DoFactory.createOrganisation(false, {
                    typ: OrganisationsTyp.KLASSE,
                    administriertVon: schule.id,
                });
                const lehrRolleDummy: Rolle<false> = DoFactory.createRolle(false, { rollenart: RollenArt.LEHR });
                const lehrer: PersonDo<true> = admin;
                const klasse: OrganisationDo<true> = await organisationRepo.save(klasseDo);
                const lehrRolle: Rolle<true> = await rolleRepo.save(lehrRolleDummy);
                const response: Response = await request(app.getHttpServer() as App)
                    .post('/dbiam/personenkontext')
                    .send({
                        personId: lehrer.id,
                        organisationId: klasse.id,
                        rolleId: lehrRolle.id,
                    });

                expect(response.status).toBe(400);
            });
        });

        describe('when user is not authorized', () => {
            it('should return error', async () => {
                const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
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
                personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);
                personpermissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

                const response: Response = await request(app.getHttpServer() as App)
                    .post('/dbiam/personenkontext')
                    .send({ personId: person.id, organisationId: organisation.id, rolleId: rolle.id });

                expect(response.status).toBe(404);
                expect(response.body).toEqual({
                    code: 404,
                    subcode: '01',
                    titel: 'Angefragte Entität existiert nicht',
                    beschreibung: 'Die angeforderte Entität existiert nicht',
                });
            });
        });

        describe('when OrganisationMatchesRollenart is not satisfied', () => {
            it('should return error and map to 400', async () => {
                const person: PersonDo<true> = await personRepo.save(DoFactory.createPerson(false));
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
                personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);
                personpermissions.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

                const response: Response = await request(app.getHttpServer() as App)
                    .post('/dbiam/personenkontext')
                    .send({ personId: person.id, organisationId: organisation.id, rolleId: rolle.id });

                expect(response.status).toBe(400);
            });
        });
    });
});
