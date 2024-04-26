import { MikroORM } from '@mikro-orm/core';
import { CallHandler, ExecutionContext, INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { PersonApiModule } from '../person-api.module.js';
import { PersonRepository } from '../persistence/person.repository.js';
import { UsernameGeneratorService } from '../domain/username-generator.service.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepo } from '../../organisation/persistence/organisation.repo.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { PersonenkontextUc } from '../../personenkontext/api/personenkontext.uc.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { PassportUser } from '../../authentication/types/user.js';
import { Person } from '../domain/person.js';
import { DomainError } from '../../../shared/error/index.js';
import { PersonenkontextResponse } from '../../personenkontext/api/personenkontext.response.js';
import { CreatePersonenkontextBodyParams } from '../../personenkontext/api/create-personenkontext.body.params.js';
import { Rolle, SichtfreigabeType } from '../../personenkontext/domain/personenkontext.enums.js';
import { PersonenkontextQueryParams } from '../../personenkontext/api/personenkontext-query.params.js';
import { PersonenQueryParams } from './personen-query.param.js';
import { UpdatePersonBodyParams } from './update-person.body.params.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';

describe('PersonController API Integration Test', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let usernameGeneratorService: DeepMocked<UsernameGeneratorService>;
    let personpermissionsRepoMock: DeepMocked<PersonPermissionsRepo>;
    let personRepository: PersonRepository;

    beforeAll(async () => {
        const keycloakUserServiceMock: KeycloakUserService = createMock<KeycloakUserService>({
            create: jest.fn().mockResolvedValue({ ok: true, value: '' }),
            setPassword: jest.fn().mockResolvedValue({ ok: true, value: '' }),
            delete: jest.fn().mockResolvedValue({ ok: true }),
        });

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                PersonApiModule,
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                MapperTestModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: UsernameGeneratorService,
                    useValue: createMock<UsernameGeneratorService>(),
                },
                {
                    provide: PersonenkontextUc,
                    useValue: createMock<PersonenkontextUc>(),
                },
                {
                    provide: KeycloakUserService,
                    useValue: createMock<KeycloakUserService>(),
                },
                {
                    provide: PersonPermissionsRepo,
                    useValue: createMock<PersonPermissionsRepo>(),
                },
                ServiceProviderRepo,
                PersonRepository,
                RolleFactory,
                RolleRepo,
                OrganisationRepo,
                DBiamPersonenkontextRepo,
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
            .overrideProvider(KeycloakUserService)
            .useValue(keycloakUserServiceMock)
            .compile();

        orm = module.get<MikroORM>(MikroORM);
        usernameGeneratorService = module.get(UsernameGeneratorService);
        usernameGeneratorService.generateUsername = jest.fn().mockResolvedValue({ ok: true, value: 'mockUsername' });
        personpermissionsRepoMock = module.get(PersonPermissionsRepo);
        personRepository = module.get(PersonRepository);

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('/POST personen (createPerson)', () => {
        describe('when successfull', () => {
            it('should return new person', async () => {
                const firstname: string = faker.person.firstName();
                const lastname: string = faker.person.lastName();
                const params: CreatePersonBodyParams = {
                    name: {
                        vorname: firstname,
                        familienname: lastname,
                    },
                };
                const response: Response = await request(app.getHttpServer() as App)
                    .post(`/personen`)
                    .send(params);

                expect(response.status).toBe(201);
                expect(response.body).toBeInstanceOf(Object);
                const responseBody: PersonendatensatzResponse = response.body as PersonendatensatzResponse;

                expect(responseBody?.person.name.vorname).toEqual(firstname);
                expect(responseBody?.person.name.familienname).toEqual(lastname);
            });
        });

        describe('when permissions are insufficient', () => {
            it('should return 404', async () => {
                jest.resetAllMocks();
                const firstname: string = faker.person.firstName();
                const lastname: string = faker.person.lastName();
                const params: CreatePersonBodyParams = {
                    name: {
                        vorname: firstname,
                        familienname: lastname,
                    },
                };
                const pp: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                pp.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);
                personpermissionsRepoMock.loadPersonPermissions.mockResolvedValueOnce(pp);

                const response: Response = await request(app.getHttpServer() as App)
                    .post(`/personen`)
                    .send(params);

                expect(response.status).toBe(404);
            });
        });
    });

    describe('/GET personen (findPersonById)', () => {
        describe('when successfull', () => {
            it('should return person', async () => {
                jest.resetAllMocks();
                const firstname: string = faker.person.firstName();
                const lastname: string = faker.person.lastName();

                const person: Person<false> = createMock<Person<false>>({ vorname: firstname, familienname: lastname });
                const persistedPerson: Person<true> | DomainError = await personRepository.create(person);
                if (persistedPerson instanceof DomainError) {
                    return;
                }
                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/personen/${persistedPerson.id}`)
                    .send();

                expect(response.status).toBe(200);
                expect(response.body).toBeInstanceOf(Object);
                const responseBody: PersonendatensatzResponse = response.body as PersonendatensatzResponse;

                expect(responseBody?.person.name.vorname).toEqual(firstname);
                expect(responseBody?.person.name.familienname).toEqual(lastname);
            });
        });

        describe('when permissions are insufficient', () => {
            it('should return 404', async () => {
                const person: Person<false> = createMock<Person<false>>();
                const persistedPerson: Person<true> | DomainError = await personRepository.create(person);
                if (persistedPerson instanceof DomainError) {
                    return;
                }

                /*const pp: DeepMocked<PersonPermissions> = createMock<PersonPermissions>();
                pp.getOrgIdsWithSystemrecht.mockResolvedValueOnce([]);
                personpermissionsRepoMock.loadPersonPermissions.mockResolvedValueOnce(pp);*/

                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/personen/${persistedPerson.id}`)
                    .send();

                expect(response.status).toBe(404);
            });
        });
    });

    describe('/POST :personId/personenkontexte (createPersonenkontext)', () => {
        describe('when successfull', () => {
            it('should return PersonenkontextResponse', async () => {
                const firstname: string = faker.person.firstName();
                const lastname: string = faker.person.lastName();

                const params: CreatePersonenkontextBodyParams = {
                    rolle: Rolle.LEHRENDER,
                };
                const person: Person<false> = createMock<Person<false>>({ vorname: firstname, familienname: lastname });
                const persistedPerson: Person<true> | DomainError = await personRepository.create(person);
                if (persistedPerson instanceof DomainError) {
                    return;
                }
                const response: Response = await request(app.getHttpServer() as App)
                    .post(`/personen/${persistedPerson.id}/personenkontexte`)
                    .send(params);

                expect(response.status).toBe(201);
                expect(response.body).toBeInstanceOf(Object);
                const responseBody: PersonenkontextResponse = response.body as PersonenkontextResponse;

                expect(responseBody?.rolle).toEqual(Rolle.LEHRENDER);
            });
        });
    });

    describe('/GET :personId/personenkontexte (findPersonenkontexte)', () => {
        describe('when successfull', () => {
            it('should return PagedResponse of PersonenkontextResponse', async () => {
                const firstname: string = faker.person.firstName();
                const lastname: string = faker.person.lastName();

                const params: PersonenkontextQueryParams = {
                    rolle: Rolle.LEHRENDER,
                    sichtfreigabe: SichtfreigabeType.NEIN,
                };
                const person: Person<false> = createMock<Person<false>>({ vorname: firstname, familienname: lastname });
                const persistedPerson: Person<true> | DomainError = await personRepository.create(person);
                if (persistedPerson instanceof DomainError) {
                    return;
                }
                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/personen/${persistedPerson.id}/personenkontexte`)
                    .send(params);

                expect(response.status).toBe(201);
            });
        });
    });

    describe('/GET (findPersons)', () => {
        describe('when successfull', () => {
            it('should return PagedResponse of PersonendatensatzResponse', async () => {
                const firstname: string = faker.person.firstName();
                const lastname: string = faker.person.lastName();

                const params: PersonenQueryParams = {
                    suchFilter: '',
                    sichtfreigabe: SichtfreigabeType.NEIN,
                };
                const person: Person<false> = createMock<Person<false>>({ vorname: firstname, familienname: lastname });
                const persistedPerson: Person<true> | DomainError = await personRepository.create(person);
                if (persistedPerson instanceof DomainError) {
                    return;
                }
                const response: Response = await request(app.getHttpServer() as App)
                    .get(`/personen`)
                    .query(params)
                    .send();

                expect(response.status).toBe(201);
                expect(response.body).toBeInstanceOf(Object);
                const responseBody: PersonendatensatzResponse = response.body as PersonendatensatzResponse;

                expect(responseBody?.person.name).toEqual(firstname);
            });
        });
    });

    describe('/PUT :personId (updatePerson)', () => {
        describe('when successfull', () => {
            it('should return PersonendatensatzResponse', async () => {
                const firstname: string = faker.person.firstName();
                const lastname: string = faker.person.lastName();

                const params: UpdatePersonBodyParams = {
                    name: {
                        vorname: 'NeuerVorname',
                        familienname: 'NeuerNachname',
                    },
                    revision: '1',
                };
                const person: Person<false> = createMock<Person<false>>({ vorname: firstname, familienname: lastname });
                const persistedPerson: Person<true> | DomainError = await personRepository.create(person);
                if (persistedPerson instanceof DomainError) {
                    return;
                }
                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/personen/${persistedPerson.id}`)
                    .send(params);

                expect(response.status).toBe(201);
                expect(response.body).toBeInstanceOf(Object);
                const responseBody: PersonendatensatzResponse = response.body as PersonendatensatzResponse;

                expect(responseBody?.person.name).toEqual('NeuerVorname');
            });
        });
    });

    describe('/PATCH :personId/password (resetPasswordByPersonId)', () => {
        describe('when successfull', () => {
            it('should return new password as string', async () => {
                const firstname: string = faker.person.firstName();
                const lastname: string = faker.person.lastName();

                const person: Person<false> = createMock<Person<false>>({ vorname: firstname, familienname: lastname });
                const persistedPerson: Person<true> | DomainError = await personRepository.create(person);
                if (persistedPerson instanceof DomainError) {
                    return;
                }
                const response: Response = await request(app.getHttpServer() as App)
                    .patch(`/personen/${persistedPerson.id}/password`)
                    .send();

                expect(response.status).toBe(200);
            });
        });
    });
});
