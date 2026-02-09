import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types.js';
import {
    ConfigTestModule,
    createAuthInterceptorMock,
    createPersonPermissionsMock,
    DatabaseTestModule,
    DoFactory,
    KeycloakConfigTestModule,
    LoggingTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/index.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonenKontextApiModule } from '../personenkontext-api.module.js';
import { RollenArt, RollenMerkmal } from '../../rolle/domain/rolle.enums.js';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';

import { DBiamPersonenkontextRepoInternal } from '../persistence/internal-dbiam-personenkontext.repo.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DbiamUpdatePersonenkontexteBodyParams } from './param/dbiam-update-personenkontexte.body.params.js';
import { OrganisationsTyp } from '../../organisation/domain/organisation.enums.js';
import { KeycloakAdministrationModule } from '../../keycloak-administration/keycloak-administration.module.js';
import { KeycloakConfigModule } from '../../keycloak-administration/keycloak-config.module.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { PersonenkontextCreationService } from '../domain/personenkontext-creation.service.js';
import { DuplicatePersonalnummerError } from '../../../shared/error/duplicate-personalnummer.error.js';
import { PersonenkontexteUpdateError } from '../domain/error/personenkontexte-update.error.js';
import { generatePassword } from '../../../shared/util/password-generator.js';
import { StepUpGuard } from '../../authentication/api/steup-up.guard.js';
import { PersonenkontextWorkflowAggregate } from '../domain/personenkontext-workflow.js';
import { PersonenkontextWorkflowFactory } from '../domain/personenkontext-workflow.factory.js';
import { createMock, DeepMocked } from '../../../../test/utils/createMock.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { DbiamPersonenkontextFactory } from '../domain/dbiam-personenkontext.factory.js';
import { ConfigService } from '@nestjs/config';
import { PersonenkontextWorkflowSharedKernel } from '../domain/personenkontext-workflow-shared-kernel.js';

describe('DbiamPersonenkontextWorkflowController Integration Test', () => {
    let app: INestApplication;
    let orm: MikroORM;
    let organisationRepo: OrganisationRepository;
    let rolleRepo: RolleRepo;
    let personPermissionsMock: DeepMocked<PersonPermissions>;
    let personRepo: PersonRepository;
    let personenkontextRepoInternal: DBiamPersonenkontextRepoInternal;
    let personFactory: PersonFactory;
    let personenkontextService: PersonenkontextCreationService;
    let personenkontextWorkflowFactoryMock: DeepMocked<PersonenkontextWorkflowFactory>;

    beforeAll(async () => {
        personPermissionsMock = createPersonPermissionsMock();
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                PersonenKontextApiModule,
                KeycloakAdministrationModule,
                LoggingTestModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
                {
                    provide: PersonPermissionsRepo,
                    useValue: createMock(PersonPermissionsRepo),
                },
                {
                    provide: PersonenkontextWorkflowFactory,
                    useValue: createMock(PersonenkontextWorkflowFactory),
                },
                {
                    provide: APP_INTERCEPTOR,
                    useValue: createAuthInterceptorMock(personPermissionsMock),
                },
            ],
        })
            .overrideModule(KeycloakConfigModule)
            .useModule(KeycloakConfigTestModule.forRoot({ isKeycloakRequired: true }))
            .compile();

        const stepUpGuard: StepUpGuard = module.get(StepUpGuard);
        stepUpGuard.canActivate = vi.fn().mockReturnValue(true);

        orm = module.get(MikroORM);
        organisationRepo = module.get(OrganisationRepository);
        rolleRepo = module.get(RolleRepo);
        personRepo = module.get(PersonRepository);
        personenkontextRepoInternal = module.get(DBiamPersonenkontextRepoInternal);
        personFactory = module.get(PersonFactory);
        personenkontextService = module.get(PersonenkontextCreationService);
        personenkontextWorkflowFactoryMock = module.get(PersonenkontextWorkflowFactory);

        await DatabaseTestModule.setupDatabase(orm);
        app = module.createNestApplication();
        await app.init();
    }, 10000000);

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
        const person: Person<true> | DomainError = await personRepo.create(personResult);
        if (person instanceof DomainError) {
            throw person;
        }

        return person;
    }

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('/POST create person with personenkontexte', () => {
        it('should return created person and personenkontexte', async () => {
            const schule: Organisation<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
            );
            const klasse: Organisation<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { typ: OrganisationsTyp.KLASSE, administriertVon: schule.id }),
            );
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: schule.id,
                    rollenart: RollenArt.LERN,
                    merkmale: [RollenMerkmal.KOPERS_PFLICHT],
                }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/personenkontext-workflow')
                .send({
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    createPersonenkontexte: [
                        {
                            organisationId: schule.id,
                            rolleId: rolle.id,
                        },
                        {
                            organisationId: klasse.id,
                            rolleId: rolle.id,
                        },
                    ],
                });
            expect(response.status).toBe(201);
        });

        it('should return created person and personenkontext with personalnummer', async () => {
            const organisation: Organisation<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LEHR,
                    merkmale: [RollenMerkmal.KOPERS_PFLICHT],
                }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/personenkontext-workflow')
                .send({
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    createPersonenkontexte: [
                        {
                            organisationId: organisation.id,
                            rolleId: rolle.id,
                        },
                    ],
                    personalnummer: '1234567',
                });
            expect(response.status).toBe(201);
        });

        it('should return error with status-code=404 if organisation does NOT exist', async () => {
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: faker.string.uuid(),
                    rollenart: RollenArt.LEHR,
                }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            personPermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(false);
            personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValue(true);
            personPermissionsMock.canModifyPerson.mockResolvedValueOnce(true);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/personenkontext-workflow')
                .send({
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    createPersonenkontexte: [
                        {
                            organisationId: faker.string.uuid(),
                            rolleId: rolle.id,
                        },
                    ],
                });

            expect(response.status).toBe(404);
        });

        it('should return error with status-code 400 if specification ROLLE_NUR_AN_PASSENDE_ORGANISATION is NOT satisfied', async () => {
            const organisation: Organisation<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.SYSADMIN,
                }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            personPermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValue(false);
            personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/personenkontext-workflow')
                .send({
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    createPersonenkontexte: [
                        {
                            organisationId: organisation.id,
                            rolleId: rolle.id,
                        },
                    ],
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                code: 400,
                i18nKey: 'ROLLE_NUR_AN_PASSENDE_ORGANISATION',
            });
        });

        it('should return error with status-code 404 if user does NOT have permissions', async () => {
            const organisation: Organisation<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LEHR,
                }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            personPermissionsMock.hasSystemrechteAtRootOrganisation.mockResolvedValueOnce(false);
            personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(false);

            const response: Response = await request(app.getHttpServer() as App)
                .post('/personenkontext-workflow')
                .send({
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    createPersonenkontexte: [
                        {
                            organisationId: organisation.id,
                            rolleId: rolle.id,
                        },
                    ],
                });
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                code: 404,
                subcode: '01',
                titel: 'Angefragte Entität existiert nicht',
                beschreibung: 'Die angeforderte Entität existiert nicht',
            });
        });
        it('should return error with status-code 400 if DuplicatePersonalnummerError is thrown', async () => {
            const organisation: Organisation<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LEHR,
                }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            // Mock the service to throw DuplicatePersonalnummerError
            vi.spyOn(personenkontextService, 'createPersonWithPersonenkontexte').mockResolvedValueOnce(
                new DuplicatePersonalnummerError('Duplicate Kopers'),
            );

            const response: Response = await request(app.getHttpServer() as App)
                .post('/personenkontext-workflow')
                .send({
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    organisationId: organisation.id,
                    rolleId: rolle.id,
                    personalnummer: '1234567',
                    createPersonenkontexte: [
                        {
                            organisationId: organisation.id,
                            rolleId: rolle.id,
                        },
                    ],
                });

            expect(response.status).toBe(400);
        });
        it('should return error with status-code 400 if PersonenkontexteUpdateError is thrown', async () => {
            const organisation: Organisation<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LEHR,
                }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            // Mock the service to throw DuplicatePersonalnummerError
            vi.spyOn(personenkontextService, 'createPersonWithPersonenkontexte').mockResolvedValueOnce(
                new PersonenkontexteUpdateError('Error'),
            );

            const response: Response = await request(app.getHttpServer() as App)
                .post('/personenkontext-workflow')
                .send({
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    createPersonenkontexte: [
                        {
                            organisationId: organisation.id,
                            rolleId: rolle.id,
                        },
                    ],
                    personalnummer: '1234567',
                });

            expect(response.status).toBe(400);
        });
        it('should return error with status-code 400 if PersonenkontexteUpdateError is thrown', async () => {
            const organisation: Organisation<true> = await organisationRepo.save(
                DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
            );
            const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                DoFactory.createRolle(false, {
                    administeredBySchulstrukturknoten: organisation.id,
                    rollenart: RollenArt.LEHR,
                }),
            );
            if (rolle instanceof DomainError) {
                throw Error();
            }

            personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValue(true);

            // Mock the service to throw DuplicatePersonalnummerError
            vi.spyOn(personenkontextService, 'createPersonWithPersonenkontexte').mockResolvedValueOnce(
                new PersonenkontexteUpdateError('Error'),
            );

            const response: Response = await request(app.getHttpServer() as App)
                .post('/personenkontext-workflow')
                .send({
                    familienname: faker.person.lastName(),
                    vorname: faker.person.firstName(),
                    createPersonenkontexte: [
                        {
                            organisationId: organisation.id,
                            rolleId: rolle.id,
                        },
                    ],
                    personalnummer: '1234567',
                });

            expect(response.status).toBe(400);
        });
    });

    describe('/PUT commit', () => {
        describe('when sending no PKs', () => {
            it('should delete and therefore return 200', async () => {
                const person: Person<true> = await createPerson();
                const orga: Organisation<true> = await organisationRepo.save(DoFactory.createOrganisation(false));
                const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, { systemrechte: [RollenSystemRecht.PERSONEN_VERWALTEN] }),
                );
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                const savedPK: Personenkontext<true> = await personenkontextRepoInternal.save(
                    DoFactory.createPersonenkontext(false, {
                        personId: person.id,
                        rolleId: rolle.id,
                        organisationId: orga.id,
                        updatedAt: new Date(),
                    }),
                );
                const updatePKsRequest: DbiamUpdatePersonenkontexteBodyParams = {
                    count: 1,
                    lastModified: savedPK.updatedAt,
                    personenkontexte: [],
                };

                personPermissionsMock.canModifyPerson.mockResolvedValueOnce(true);
                personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/personenkontext-workflow/${person.id}`)
                    .send(updatePKsRequest);

                expect(response.status).toBe(200);
            });
        });

        describe('when errors occur', () => {
            it('should return error because the count is not matching', async () => {
                const person: Person<true> = await createPerson();
                const rolle: Rolle<true> | DomainError = await rolleRepo.save(DoFactory.createRolle(false));
                if (rolle instanceof DomainError) {
                    throw rolle;
                }
                const organisation: Organisation<true> = await organisationRepo.save(
                    DoFactory.createOrganisation(false),
                );
                const savedPK: Personenkontext<true> = await personenkontextRepoInternal.save(
                    DoFactory.createPersonenkontext(false, {
                        personId: person.id,
                        rolleId: rolle.id,
                        organisationId: organisation.id,
                        updatedAt: new Date(),
                    }),
                );
                const updatePKsRequest: DbiamUpdatePersonenkontexteBodyParams = {
                    count: 0,
                    lastModified: savedPK.updatedAt,
                    personenkontexte: [],
                };

                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/personenkontext-workflow/${person.id}`)
                    .send(updatePKsRequest);

                expect(response.status).toBe(400);
            });
        });

        describe('for Person with a PK rolle with rollenart LERN', () => {
            it('should return error with status-code 400, if the new PK rolle is not rollenart LERN', async () => {
                const schueler: Person<true> = await createPerson();
                const schule: Organisation<true> = await organisationRepo.save(
                    DoFactory.createOrganisation(false, { typ: OrganisationsTyp.SCHULE }),
                );
                const lernRolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, { rollenart: RollenArt.LERN, systemrechte: [] }),
                );
                if (lernRolle instanceof DomainError) {
                    throw Error();
                }

                const savedPK: Personenkontext<true> = await personenkontextRepoInternal.save(
                    DoFactory.createPersonenkontext(false, {
                        personId: schueler.id,
                        rolleId: lernRolle.id,
                        organisationId: schule.id,
                        updatedAt: new Date(),
                    }),
                );

                const lehrerRolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, {
                        rollenart: RollenArt.LEHR,
                        systemrechte: [RollenSystemRecht.KLASSEN_VERWALTEN],
                    }),
                );
                if (lehrerRolle instanceof DomainError) {
                    throw Error();
                }

                const updatePKsRequest: DbiamUpdatePersonenkontexteBodyParams = {
                    count: 2,
                    lastModified: savedPK.updatedAt,
                    personenkontexte: [
                        {
                            personId: schueler.id,
                            rolleId: lernRolle.id,
                            organisationId: schule.id,
                        },
                        {
                            personId: schueler.id,
                            rolleId: lehrerRolle.id,
                            organisationId: schule.id,
                        },
                    ],
                };

                personPermissionsMock.canModifyPerson.mockResolvedValueOnce(true);
                personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/personenkontext-workflow/${schueler.id}`)
                    .send(updatePKsRequest);

                expect(response.status).toBe(400);
                expect(response.body).toEqual({
                    code: 400,
                    i18nKey: 'INVALID_PERSONENKONTEXT_FOR_PERSON_WITH_ROLLENART_LERN',
                });
            });
        });

        describe('when duplicate personalnummer error occurs', () => {
            it('should return error with status-code 400 for duplicate personalnummer', async () => {
                const person: Person<true> = await createPerson();
                const orga: Organisation<true> = await organisationRepo.save(DoFactory.createOrganisation(false));
                const rolle: Rolle<true> | DomainError = await rolleRepo.save(
                    DoFactory.createRolle(false, { systemrechte: [RollenSystemRecht.PERSONEN_VERWALTEN] }),
                );
                if (rolle instanceof DomainError) {
                    throw Error();
                }

                const savedPK: Personenkontext<true> = await personenkontextRepoInternal.save(
                    DoFactory.createPersonenkontext(false, {
                        personId: person.id,
                        rolleId: rolle.id,
                        organisationId: orga.id,
                        updatedAt: new Date(),
                    }),
                );

                const updatePKsRequest: DbiamUpdatePersonenkontexteBodyParams = {
                    count: 1,
                    lastModified: savedPK.updatedAt,
                    personenkontexte: [
                        {
                            personId: person.id,
                            rolleId: rolle.id,
                            organisationId: orga.id,
                        },
                    ],
                };

                personPermissionsMock.canModifyPerson.mockResolvedValueOnce(true);
                personPermissionsMock.hasSystemrechtAtOrganisation.mockResolvedValueOnce(true);

                const mockWorkflow: DeepMocked<PersonenkontextWorkflowAggregate> = vi.mockObject(
                    PersonenkontextWorkflowAggregate.createNew(
                        null as unknown as RolleRepo,
                        null as unknown as OrganisationRepository,
                        null as unknown as DBiamPersonenkontextRepo,
                        null as unknown as DbiamPersonenkontextFactory,
                        null as unknown as ConfigService,
                        null as unknown as PersonenkontextWorkflowSharedKernel,
                    ),
                );
                mockWorkflow.commit.mockResolvedValueOnce(new DuplicatePersonalnummerError('12345'));

                vi.spyOn(personenkontextWorkflowFactoryMock, 'createNew').mockReturnValueOnce(mockWorkflow);

                const response: Response = await request(app.getHttpServer() as App)
                    .put(`/personenkontext-workflow/${person.id}`)
                    .query({ personalnummer: '12345' })
                    .send(updatePKsRequest);

                expect(response.status).toBe(400);
                expect(response.body).toEqual({
                    code: 400,
                    i18nKey: 'PERSONALNUMMER_NICHT_EINDEUTIG',
                });
            });
        });
    });
});
