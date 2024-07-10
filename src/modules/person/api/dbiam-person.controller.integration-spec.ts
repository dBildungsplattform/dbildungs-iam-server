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
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonApiModule } from '../person-api.module.js';
import { KeycloakConfigModule } from '../../keycloak-administration/keycloak-config.module.js';
import { KeycloakAdministrationModule } from '../../keycloak-administration/keycloak-administration.module.js';

describe('dbiam Person API', () => {
    let app: INestApplication;
    let orm: MikroORM;

    let organisationRepo: OrganisationRepo;
    let rolleRepo: RolleRepo;
    let personpermissionsRepoMock: DeepMocked<PersonPermissionsRepo>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MapperTestModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                KeycloakAdministrationModule,
                PersonApiModule,
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
        organisationRepo = module.get(OrganisationRepo);
        rolleRepo = module.get(RolleRepo);
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
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisation.id]);
            personpermissions.hasSystemrechteAtOrganisation.mockResolvedValueOnce(true);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personen')
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
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValueOnce(permissions);
            permissions.hasSystemrechteAtOrganisation.mockResolvedValueOnce(true);
            permissions.canModifyPerson.mockResolvedValueOnce(true);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personen')
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
            personpermissions.hasSystemrechteAtOrganisation.mockResolvedValueOnce(true);
            personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(personpermissions);
            personpermissions.getOrgIdsWithSystemrecht.mockResolvedValueOnce([organisation.id]);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/dbiam/personen')
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
                .post('/dbiam/personen')
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
});
