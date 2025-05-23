import { faker } from '@faker-js/faker';
import { EntityManager, MikroORM } from '@mikro-orm/core';
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
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';
import { OrganisationEntity } from '../persistence/organisation.entity.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Observable } from 'rxjs';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { PassportUser } from '../../authentication/types/user.js';
import { Request } from 'express';
import { OrganisationApiModule } from '../organisation-api.module.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { DBiamPersonenkontextRepoInternal } from '../../personenkontext/persistence/internal-dbiam-personenkontext.repo.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { PersonenkontextFactory } from '../../personenkontext/domain/personenkontext.factory.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { RollenArt } from '../../rolle/domain/rolle.enums.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { KeycloakUserService } from '../../keycloak-administration/domain/keycloak-user.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { Person } from '../../person/domain/person.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { KeycloakConfigModule } from '../../keycloak-administration/keycloak-config.module.js';
import { generatePassword } from '../../../shared/util/password-generator.js';
import { StepUpGuard } from '../../authentication/api/steup-up.guard.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';

describe('Organisation API', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let em: EntityManager;
    let rolleRepo: RolleRepo;
    let personRepo: PersonRepository;
    let dBiamPersonenkontextRepoInternal: DBiamPersonenkontextRepoInternal;
    let personenkontextFactory: PersonenkontextFactory;
    let personFactory: PersonFactory;

    let personpermissionsRepoMock: DeepMocked<PersonPermissionsRepo>;
    let permissionsMock: DeepMocked<PersonPermissions>;

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
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                OrganisationApiModule,
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
                {
                    provide: PersonPermissionsRepo,
                    useValue: createMock<PersonPermissionsRepo>(),
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
            ],
        })
            .overrideModule(KeycloakConfigModule)
            .useModule(KeycloakConfigTestModule.forRoot({ isKeycloakRequired: true }))
            .compile();

        const stepUpGuard: StepUpGuard = module.get(StepUpGuard);
        stepUpGuard.canActivate = jest.fn().mockReturnValue(true);

        orm = module.get(MikroORM);
        em = module.get(EntityManager);
        rolleRepo = module.get(RolleRepo);
        personRepo = module.get(PersonRepository);
        personenkontextFactory = module.get(PersonenkontextFactory);
        dBiamPersonenkontextRepoInternal = module.get(DBiamPersonenkontextRepoInternal);
        personFactory = module.get(PersonFactory);
        personpermissionsRepoMock = module.get(PersonPermissionsRepo);

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, 10000000);

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        permissionsMock = createMock<PersonPermissions>();
        personpermissionsRepoMock.loadPersonPermissions.mockResolvedValue(permissionsMock);
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('/DELETE organisationId', () => {
        describe('should return error', () => {
            it('if user is missing permissions', async () => {
                permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/organisationen/${faker.string.uuid()}/klasse`)
                    .send();

                expect(response.status).toBe(404);
            });

            it('if Organisation does NOT exist', async () => {
                permissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/organisationen/${faker.string.uuid()}/klasse`)
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
                    .delete(`/organisationen/${faker.string.uuid()}/klasse`)
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
                        administeredBySchulstrukturknoten: organisation.id,
                        rollenart: RollenArt.LERN,
                    }),
                );
                if (rolle instanceof DomainError) throw Error();

                await dBiamPersonenkontextRepoInternal.save(
                    createPersonenkontext(false, {
                        personId: person.id,
                        rolleId: rolle.id,
                        organisationId: organisation.id,
                    }),
                );

                const response: Response = await request(app.getHttpServer() as App)
                    .delete(`/organisationen/${organisation.id}/klasse`)
                    .send();

                expect(response.status).toBe(400);
                expect(response.body).toEqual({
                    code: 400,
                    i18nKey: 'ORGANISATION_IST_BEREITS_ZUGEWIESEN_ERROR',
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
                    .delete(`/organisationen/${organisation.id}/klasse`)
                    .send();

                expect(response.status).toBe(204);
            });
        });
    });
});
