import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';

import { LdapModule } from '../ldap.module.js';
import { OrganisationApiModule } from '../../../modules/organisation/organisation-api.module.js';
import { PersonenKontextApiModule } from '../../../modules/personenkontext/personenkontext-api.module.js';
import { LdapEventHandler } from './ldap-event-handler.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LdapClientService } from './ldap-client.service.js';
import { SchuleCreatedEvent } from '../../../shared/events/schule-created.event.js';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { RolleRepo } from '../../../modules/rolle/repo/rolle.repo.js';
import { faker } from '@faker-js/faker';
import { Organisation } from '../../../modules/organisation/domain/organisation.js';
import { RollenArt } from '../../../modules/rolle/domain/rolle.enums.js';
import { SchuleDeletedEvent } from '../../../shared/events/schule-deleted.event.js';
import { DBiamPersonenkontextRepo } from '../../../modules/personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from '../../../modules/personenkontext/domain/personenkontext.factory.js';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event.js';
import { ClassLogger } from '../../logging/class-logger.js';

describe('LDAP Event Handler', () => {
    let app: INestApplication;
    let orm: MikroORM;

    let ldapEventHandler: LdapEventHandler;
    let ldapClientServiceMock: DeepMocked<LdapClientService>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                LdapModule,
                MapperTestModule,
                OrganisationApiModule,
                PersonenKontextApiModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
            ],
        })
            .overrideProvider(LdapClientService)
            .useValue(createMock<LdapClientService>())
            .overrideProvider(PersonRepository)
            .useValue(createMock<PersonRepository>())
            .overrideProvider(PersonenkontextFactory)
            .useClass(PersonenkontextFactory)
            .overrideProvider(RolleRepo)
            .useValue(createMock<RolleRepo>())
            .overrideProvider(DBiamPersonenkontextRepo)
            .useValue(createMock<DBiamPersonenkontextRepo>())
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
            .compile();

        orm = module.get(MikroORM);

        ldapEventHandler = module.get(LdapEventHandler);
        ldapClientServiceMock = module.get(LdapClientService);
        loggerMock = module.get(ClassLogger);

        await DatabaseTestModule.setupDatabase(module.get(MikroORM));
        app = module.createNestApplication();
        await app.init();
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        jest.resetAllMocks();
        await DatabaseTestModule.clearDatabase(orm);
    });

    describe('asyncSchuleCreatedEventHandler', () => {
        describe('when type is SCHULE and creation is successful', () => {
            it('should execute without errors', async () => {
                const event: SchuleCreatedEvent = new SchuleCreatedEvent(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    faker.word.noun(),
                    faker.string.uuid(),
                );
                const result: Result<void> = {
                    ok: true,
                    value: undefined,
                };

                ldapClientServiceMock.createOrganisation.mockResolvedValueOnce(result);

                await ldapEventHandler.handleSchuleCreatedEvent(event);
                expect(ldapClientServiceMock.createOrganisation).toHaveBeenCalledTimes(1);
            });
        });

        describe('when creation fails', () => {
            it('should execute without errors', async () => {
                const event: SchuleCreatedEvent = new SchuleCreatedEvent(
                    faker.string.uuid(),
                    faker.string.uuid(),
                    faker.word.noun(),
                    faker.string.uuid(),
                );
                const result: Result<Organisation<true>> = {
                    ok: false,
                    error: new Error(),
                };

                // organisationRepositoryMock.findById.mockResolvedValueOnce(organisation);
                ldapClientServiceMock.createOrganisation.mockResolvedValueOnce(result);

                await ldapEventHandler.handleSchuleCreatedEvent(event);
                expect(ldapClientServiceMock.createOrganisation).toHaveBeenCalledTimes(1);
            });
        });

        it('should skip event, if kennung is undefined', async () => {
            const organisationId: string = faker.string.uuid();
            const event: SchuleCreatedEvent = new SchuleCreatedEvent(
                organisationId,
                undefined,
                faker.word.noun(),
                faker.string.uuid(),
            );

            await ldapEventHandler.handleSchuleCreatedEvent(event);

            expect(loggerMock.info).toHaveBeenCalledWith(
                `Received SchuleCreatedEvent, organisationId:${organisationId}`,
            );
            expect(loggerMock.error).toHaveBeenCalledWith('Schule has no kennung. Aborting.');
            expect(ldapClientServiceMock.createOrganisation).not.toHaveBeenCalled();
        });
    });

    describe('asyncSchuleDeletedEventHandler', () => {
        describe('deletion is successful', () => {
            it('should execute without errors', async () => {
                const event: SchuleDeletedEvent = new SchuleDeletedEvent(faker.string.uuid(), '1234567', 'Teschule');
                const result: Result<void> = {
                    ok: true,
                    value: undefined,
                };

                ldapClientServiceMock.deleteOrganisation.mockResolvedValueOnce(result);

                await ldapEventHandler.handleSchuleDeletedEvent(event);
                expect(ldapClientServiceMock.deleteOrganisation).toHaveBeenCalledTimes(1);
            });
        });

        describe('deletion fails', () => {
            it('should execute without errors', async () => {
                const event: SchuleDeletedEvent = new SchuleDeletedEvent(faker.string.uuid(), '1234567', 'Teschule');

                const result: Result<Organisation<true>> = {
                    ok: false,
                    error: new Error(),
                };

                ldapClientServiceMock.deleteOrganisation.mockResolvedValueOnce(result);

                await ldapEventHandler.handleSchuleDeletedEvent(event);
                expect(ldapClientServiceMock.deleteOrganisation).toHaveBeenCalledTimes(1);
            });
        });

        it('should skip event, if kennung is undefined', async () => {
            const organisationId: string = faker.string.uuid();
            const event: SchuleDeletedEvent = new SchuleDeletedEvent(organisationId, undefined, faker.word.noun());

            await ldapEventHandler.handleSchuleDeletedEvent(event);

            expect(loggerMock.info).toHaveBeenCalledWith(
                `Received SchuleDeletedEvent, organisationId:${organisationId}`,
            );
            expect(loggerMock.error).toHaveBeenCalledWith('Schule has no kennung. Aborting.');
            expect(ldapClientServiceMock.deleteOrganisation).not.toHaveBeenCalled();
        });
    });

    describe('handlePersonenkontextUpdatedEvent', () => {
        it('should call ldap client for every new personenkontext with correct role', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    referrer: faker.internet.userName(),
                },
                [
                    {
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                    },
                    {
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.EXTERN,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                    },
                ],
                [],
                [],
            );

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(ldapClientServiceMock.createLehrer).toHaveBeenCalledTimes(1);
        });

        it('should call ldap client for every deleted personenkontext with correct role', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    referrer: faker.internet.userName(),
                },
                [],
                [
                    {
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                    },
                    {
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.EXTERN,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                    },
                ],
                [],
            );

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(ldapClientServiceMock.deleteLehrer).toHaveBeenCalledTimes(1);
        });

        describe('when ldap client fails', () => {
            it('should execute without errors, if creation of lehrer fails', async () => {
                const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                    {
                        id: faker.string.uuid(),
                        vorname: faker.person.firstName(),
                        familienname: faker.person.lastName(),
                        referrer: faker.internet.userName(),
                    },
                    [
                        {
                            orgaId: faker.string.uuid(),
                            rolle: RollenArt.LEHR,
                            rolleId: faker.string.uuid(),
                            orgaKennung: faker.string.numeric(7),
                        },
                    ],
                    [],
                    [],
                );
                ldapClientServiceMock.createLehrer.mockResolvedValueOnce({ ok: false, error: new Error('Error') });

                await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

                expect(ldapClientServiceMock.createLehrer).toHaveBeenCalledTimes(1);
            });
        });

        it('should execute without errors, if deletion of lehrer fails', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    referrer: faker.internet.userName(),
                },
                [],
                [
                    {
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                    },
                ],
                [],
            );
            ldapClientServiceMock.deleteLehrer.mockResolvedValueOnce({ ok: false, error: new Error('Error') });

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(ldapClientServiceMock.deleteLehrer).toHaveBeenCalledTimes(1);
        });
    });
});
