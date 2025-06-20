import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
    MapperTestModule,
} from '../../../../test/utils/index.js';
import { GlobalValidationPipe } from '../../../shared/validation/global-validation.pipe.js';

import { LdapModule } from '../ldap.module.js';
import { LdapEventHandler } from './ldap-event-handler.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LdapClientService, PersonData } from './ldap-client.service.js';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { RolleRepo } from '../../../modules/rolle/repo/rolle.repo.js';
import { faker } from '@faker-js/faker';
import { RollenArt } from '../../../modules/rolle/domain/rolle.enums.js';
import { DBiamPersonenkontextRepo } from '../../../modules/personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from '../../../modules/personenkontext/domain/personenkontext.factory.js';
import { PersonenkontextUpdatedEvent } from '../../../shared/events/personenkontext-updated.event.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { PersonID, PersonReferrer } from '../../../shared/types/aggregate-ids.types.js';
import { PersonDeletedEvent } from '../../../shared/events/person-deleted.event.js';
import { LdapSearchError } from '../error/ldap-search.error.js';
import { LdapEntityType } from './ldap.types.js';
import { EmailAddressGeneratedEvent } from '../../../shared/events/email/email-address-generated.event.js';
import { OrganisationRepository } from '../../../modules/organisation/persistence/organisation.repository.js';
import { PersonRenamedEvent } from '../../../shared/events/person-renamed-event.js';
import { EmailAddressChangedEvent } from '../../../shared/events/email/email-address-changed.event.js';
import { EmailAddressMarkedForDeletionEvent } from '../../../shared/events/email/email-address-marked-for-deletion.event.js';
import { EmailAddressStatus } from '../../../modules/email/domain/email-address.js';
import { EventRoutingLegacyKafkaService } from '../../eventbus/services/event-routing-legacy-kafka.service.js';
import { EmailAddressesPurgedEvent } from '../../../shared/events/email/email-addresses-purged.event.js';
import { PersonDeletedAfterDeadlineExceededEvent } from '../../../shared/events/person-deleted-after-deadline-exceeded.event.js';

describe('LdapEventHandler', () => {
    let app: INestApplication;
    let orm: MikroORM;

    let ldapEventHandler: LdapEventHandler;
    let ldapClientServiceMock: DeepMocked<LdapClientService>;
    let organisationRepositoryMock: DeepMocked<OrganisationRepository>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let eventServiceMock: DeepMocked<EventRoutingLegacyKafkaService>;
    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigTestModule,
                DatabaseTestModule.forRoot({ isDatabaseRequired: true }),
                LdapModule,
                MapperTestModule,
            ],
            providers: [
                {
                    provide: APP_PIPE,
                    useClass: GlobalValidationPipe,
                },
            ],
        })
            .overrideProvider(ClassLogger)
            .useValue(createMock<ClassLogger>())
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
            .overrideProvider(OrganisationRepository)
            .useValue(createMock<OrganisationRepository>())
            .overrideProvider(EventRoutingLegacyKafkaService)
            .useValue(createMock<EventRoutingLegacyKafkaService>())
            .compile();

        orm = module.get(MikroORM);

        ldapEventHandler = module.get(LdapEventHandler);
        ldapClientServiceMock = module.get(LdapClientService);
        organisationRepositoryMock = module.get(OrganisationRepository);
        personRepositoryMock = module.get(PersonRepository);
        eventServiceMock = module.get(EventRoutingLegacyKafkaService);
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

    describe('handlePersonDeletedEvent', () => {
        describe('when calling LdapClientService.deleteLehrerByUsername is successful', () => {
            it('should NOT log errors', async () => {
                const deletionResult: Result<PersonID> = {
                    ok: true,
                    value: faker.string.uuid(),
                };
                ldapClientServiceMock.deleteLehrerByUsername.mockResolvedValueOnce(deletionResult);

                await ldapEventHandler.handlePersonDeletedEvent(createMock<PersonDeletedEvent>());

                expect(loggerMock.error).toHaveBeenCalledTimes(0);
            });
        });

        describe('when calling LdapClientService.deleteLehrerByUsername is return error', () => {
            it('should log errors', async () => {
                const error: LdapSearchError = new LdapSearchError(LdapEntityType.LEHRER);
                const deletionResult: Result<PersonID> = {
                    ok: false,
                    error: error,
                };
                ldapClientServiceMock.deleteLehrerByUsername.mockResolvedValueOnce(deletionResult);

                await ldapEventHandler.handlePersonDeletedEvent(createMock<PersonDeletedEvent>());

                expect(loggerMock.error).toHaveBeenCalledTimes(1);
                expect(loggerMock.error).toHaveBeenCalledWith(error.message);
            });
        });
    });

    describe('handlePersonDeletedAfterDeadlineExceededEvent', () => {
        describe('when calling LdapClientService.deleteLehrerByUsername is successful', () => {
            it('should NOT log errors', async () => {
                const deletionResult: Result<PersonID> = {
                    ok: true,
                    value: faker.string.uuid(),
                };
                ldapClientServiceMock.deleteLehrerByUsername.mockResolvedValueOnce(deletionResult);

                await ldapEventHandler.handlePersonDeletedAfterDeadlineExceededEvent(
                    createMock<PersonDeletedAfterDeadlineExceededEvent>(),
                );

                expect(loggerMock.error).toHaveBeenCalledTimes(0);
            });
        });

        describe('when calling LdapClientService.deleteLehrerByUsername is return error', () => {
            it('should log errors', async () => {
                const error: LdapSearchError = new LdapSearchError(LdapEntityType.LEHRER);
                const deletionResult: Result<PersonID> = {
                    ok: false,
                    error: error,
                };
                ldapClientServiceMock.deleteLehrerByUsername.mockResolvedValueOnce(deletionResult);

                await ldapEventHandler.handlePersonDeletedAfterDeadlineExceededEvent(
                    createMock<PersonDeletedAfterDeadlineExceededEvent>(),
                );

                expect(loggerMock.error).toHaveBeenCalledTimes(1);
                expect(loggerMock.error).toHaveBeenCalledWith(error.message);
            });
        });
    });

    describe('handlePersonRenamedEvent', () => {
        describe('when calling LdapClientService.modifyPersonAttributes is successful', () => {
            it('should NOT log errors', async () => {
                const modifyResult: Result<PersonReferrer> = {
                    ok: true,
                    value: faker.internet.userName(),
                };
                ldapClientServiceMock.modifyPersonAttributes.mockResolvedValueOnce(modifyResult);
                await ldapEventHandler.personRenamedEventHandler(createMock<PersonRenamedEvent>());
                expect(loggerMock.error).toHaveBeenCalledTimes(0);
            });
        });
        describe('when calling LdapClientService.modifyPersonAttributes is not successful', () => {
            it('should log errors', async () => {
                const error: LdapSearchError = new LdapSearchError(LdapEntityType.LEHRER);
                const modifyResult: Result<PersonID> = {
                    ok: false,
                    error: error,
                };
                ldapClientServiceMock.modifyPersonAttributes.mockResolvedValueOnce(modifyResult);
                await ldapEventHandler.personRenamedEventHandler(createMock<PersonRenamedEvent>());
                expect(loggerMock.error).toHaveBeenCalledWith(error.message);
            });
        });
    });

    describe('handlePersonenkontextUpdatedEvent', () => {
        it('should call ldap client for every new personenkontext with correct role', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.EXTERN,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
                [],
            );

            organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce('schule-sh.de');

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(ldapClientServiceMock.createLehrer).toHaveBeenCalledTimes(1);
        });

        it('when organisation of created PK has no valid emailDomain should log error', async () => {
            const createdPKOrgaId: string = faker.string.uuid();
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: createdPKOrgaId,
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.EXTERN,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
                [],
            );

            organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(undefined);

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `LdapClientService createLehrer NOT called, because organisation:${createdPKOrgaId} has no valid emailDomain`,
            );
            expect(ldapClientServiceMock.createLehrer).toHaveBeenCalledTimes(0);
        });

        it('should call ldap client for every deleted personenkontext with correct role (if person has PK with rollenArt LEHR left)', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [],
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.EXTERN,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
            );

            organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce('schule-sh.de');

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(ldapClientServiceMock.removePersonFromGroupByUsernameAndKennung).toHaveBeenCalledTimes(1);
        });

        it('should NOT call ldap client for deleting person in LDAP when person still has at least one PK with rollenArt LEHR left', async () => {
            const fakeOrgaID: string = faker.string.uuid();
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [],
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: fakeOrgaID,
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: fakeOrgaID,
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
            );

            organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce('schule-sh.de');
            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);
            expect(ldapClientServiceMock.deleteLehrer).toHaveBeenCalledTimes(0);
        });

        it('when organisation of deleted PK has no valid emailDomain should log error', async () => {
            const removedOrgaId: string = faker.string.uuid();
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [],
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: removedOrgaId,
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.EXTERN,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
            );

            organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce(undefined);

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(loggerMock.error).toHaveBeenLastCalledWith(
                `LdapClientService removePersonFromGroup NOT called, because organisation:${removedOrgaId} has no valid emailDomain`,
            );
            expect(ldapClientServiceMock.deleteLehrer).toHaveBeenCalledTimes(0);
        });

        describe('when ldap client fails', () => {
            it('should execute without errors, if creation of lehrer fails', async () => {
                const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                    {
                        id: faker.string.uuid(),
                        vorname: faker.person.firstName(),
                        familienname: faker.person.lastName(),
                        username: faker.internet.userName(),
                    },
                    [
                        {
                            id: faker.string.uuid(),
                            orgaId: faker.string.uuid(),
                            rolle: RollenArt.LEHR,
                            rolleId: faker.string.uuid(),
                            orgaKennung: faker.string.numeric(7),
                            isItslearningOrga: false,
                            serviceProviderExternalSystems: [],
                        },
                    ],
                    [],
                    [],
                );
                ldapClientServiceMock.createLehrer.mockResolvedValueOnce({ ok: false, error: new Error('Error') });

                organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce('schule-sh.de');

                await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

                expect(ldapClientServiceMock.createLehrer).toHaveBeenCalledTimes(1);
            });
        });

        it('should execute without errors, if removePersonFromGroup fails', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [],
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
            );
            ldapClientServiceMock.removePersonFromGroupByUsernameAndKennung.mockResolvedValueOnce({
                ok: false,
                error: new Error('Error'),
            });

            organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce('schule-sh.de');

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(ldapClientServiceMock.removePersonFromGroupByUsernameAndKennung).toHaveBeenCalledTimes(1);
        });

        it('should log an error when a removed personenkontext has no orgaKennung', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [],
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: undefined,
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
            );

            organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce('schule-sh.de');
            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);
            expect(ldapClientServiceMock.deleteLehrer).toHaveBeenCalledTimes(0);
        });

        it('should log an error when a new personenkontext has no orgaKennung', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: undefined,
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
                [],
            );

            organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce('schule-sh.de');

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);
            expect(ldapClientServiceMock.createLehrer).toHaveBeenCalledTimes(0);
        });

        it('should log error when error occurs in removePersonFromGroupByUsernameAndKennung', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [],
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.EXTERN,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
            );

            organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce('schule-sh.de');
            ldapClientServiceMock.removePersonFromGroupByUsernameAndKennung.mockRejectedValueOnce(
                new Error('removePersonFromGroup error'),
            );

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(loggerMock.error).toHaveBeenCalledTimes(1);
            expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('Error in removePersonFromGroup:'));
        });

        it('should log error when error occurs while getEmailDomainForOrganisationId deleting person', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [],
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.EXTERN,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
            );

            organisationRepositoryMock.findEmailDomainForOrganisation.mockRejectedValueOnce(new Error('Test'));

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(loggerMock.error).toHaveBeenCalledTimes(1);
            expect(loggerMock.error).toHaveBeenCalledWith(
                expect.stringContaining('Error in getEmailDomainForOrganisationId:'),
            );
        });

        it('should log error when error occurs while create Lehrer', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.EXTERN,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
                [],
            );

            organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce('schule-sh.de');
            ldapClientServiceMock.createLehrer.mockRejectedValueOnce(new Error('createLehrer error'));

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(loggerMock.error).toHaveBeenCalledTimes(1);
            expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('Error in createLehrer:'));
        });

        it('should log error when error occurs while getEmailDomainForOrganisationId adding person', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.EXTERN,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
                [],
            );

            organisationRepositoryMock.findEmailDomainForOrganisation.mockRejectedValueOnce(new Error('Test'));

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(loggerMock.error).toHaveBeenCalledTimes(1);
            expect(loggerMock.error).toHaveBeenCalledWith(
                expect.stringContaining('Error in getEmailDomainForOrganisationId:'),
            );
        });

        it('should persist entryUUID to database', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.EXTERN,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
                [],
            );

            const entryUUID: string = faker.string.uuid();

            organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce('schule-sh.de');
            ldapClientServiceMock.createLehrer.mockResolvedValueOnce({
                ok: true,
                value: createMock<PersonData>({
                    ldapEntryUUID: entryUUID,
                }),
            });

            personRepositoryMock.findById.mockResolvedValueOnce(DoFactory.createPerson(true));

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(personRepositoryMock.save).toHaveBeenCalledTimes(1);
        });

        it('should log error if person can not be found', async () => {
            const event: PersonenkontextUpdatedEvent = new PersonenkontextUpdatedEvent(
                {
                    id: faker.string.uuid(),
                    vorname: faker.person.firstName(),
                    familienname: faker.person.lastName(),
                    username: faker.internet.userName(),
                },
                [
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.LEHR,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                    {
                        id: faker.string.uuid(),
                        orgaId: faker.string.uuid(),
                        rolle: RollenArt.EXTERN,
                        rolleId: faker.string.uuid(),
                        orgaKennung: faker.string.numeric(7),
                        isItslearningOrga: false,
                        serviceProviderExternalSystems: [],
                    },
                ],
                [],
                [],
            );

            const entryUUID: string = faker.string.uuid();

            organisationRepositoryMock.findEmailDomainForOrganisation.mockResolvedValueOnce('schule-sh.de');
            ldapClientServiceMock.createLehrer.mockResolvedValueOnce({
                ok: true,
                value: createMock<PersonData>({
                    ldapEntryUUID: entryUUID,
                }),
            });

            personRepositoryMock.findById.mockResolvedValueOnce(undefined);

            await ldapEventHandler.handlePersonenkontextUpdatedEvent(event);

            expect(personRepositoryMock.save).toHaveBeenCalledTimes(0);
            expect(loggerMock.error).toHaveBeenCalledWith(
                `LdapClientService createLehrer could not find person with id:${event.person.id}, ref:${event.person.username}`,
            );
        });
    });

    describe('handleEmailAddressGeneratedEvent', () => {
        it('should call ldap client changeEmailAddressByPersonId', async () => {
            const event: EmailAddressGeneratedEvent = new EmailAddressGeneratedEvent(
                faker.string.uuid(),
                faker.internet.userName(),
                faker.string.uuid(),
                faker.internet.email(),
                true,
                faker.string.numeric(),
            );

            await ldapEventHandler.handleEmailAddressGeneratedEvent(event);

            expect(loggerMock.info).toHaveBeenLastCalledWith(
                `Received EmailAddressGeneratedEvent, personId:${event.personId}, username:${event.username}, emailAddress:${event.address}`,
            );
            expect(ldapClientServiceMock.changeEmailAddressByPersonId).toHaveBeenCalledTimes(1);
        });
    });

    describe('handleEmailAddressChangedEvent', () => {
        it('should call LdapClientService changeEmailAddressByPersonId', async () => {
            const event: EmailAddressChangedEvent = new EmailAddressChangedEvent(
                faker.string.uuid(),
                faker.internet.userName(),
                faker.string.uuid(),
                faker.internet.email(),
                faker.string.uuid(),
                faker.internet.email(),
                faker.string.numeric(),
            );

            await ldapEventHandler.handleEmailAddressChangedEvent(event);

            expect(loggerMock.info).toHaveBeenLastCalledWith(
                `Received EmailAddressChangedEvent, personId:${event.personId}, newEmailAddress:${event.newAddress}, oldEmailAddress:${event.oldAddress}`,
            );
            expect(ldapClientServiceMock.changeEmailAddressByPersonId).toHaveBeenCalledTimes(1);
        });
    });

    describe('handleEmailAddressMarkedForDeletionEvent', () => {
        let personId: PersonID;
        let username: PersonReferrer;
        let address: string;

        beforeEach(() => {
            personId = faker.string.uuid();
            username = faker.internet.userName();
            address = faker.internet.email();
        });
        describe('when username is UNDEFINED in event', () => {
            it('should NOT call LdapClientService removeMailAlternativeAddress and instead publish LdapEmailAddressDeletedEvent directly', async () => {
                const event: EmailAddressMarkedForDeletionEvent = new EmailAddressMarkedForDeletionEvent(
                    personId,
                    undefined,
                    faker.string.numeric(),
                    faker.string.uuid(),
                    EmailAddressStatus.DISABLED,
                    address,
                );

                await ldapEventHandler.handleEmailAddressMarkedForDeletionEvent(event);

                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Received EmailAddressDeletedEvent, personId:${event.personId}, username:${event.username}, address:${event.address}`,
                );
                expect(loggerMock.info).toHaveBeenCalledWith(
                    `Username UNDEFINED in EmailAddressDeletedEvent, skipping removal of MailAlternativeAddress in LDAP, oxUserId:${event.oxUserId}`,
                );
                expect(ldapClientServiceMock.removeMailAlternativeAddress).toHaveBeenCalledTimes(0);
                expect(eventServiceMock.publish).toHaveBeenCalledWith(
                    expect.objectContaining({
                        personId: personId,
                        username: undefined,
                        address: address,
                    }),
                    expect.objectContaining({
                        personId: personId,
                        username: undefined,
                        address: address,
                    }),
                );
            });
        });

        describe('when username is defined in event', () => {
            it('should call LdapClientService removeMailAlternativeAddress', async () => {
                const event: EmailAddressMarkedForDeletionEvent = new EmailAddressMarkedForDeletionEvent(
                    personId,
                    username,
                    faker.string.numeric(),
                    faker.string.uuid(),
                    EmailAddressStatus.DISABLED,
                    address,
                );
                ldapClientServiceMock.removeMailAlternativeAddress.mockResolvedValueOnce({ ok: true, value: true });
                await ldapEventHandler.handleEmailAddressMarkedForDeletionEvent(event);

                expect(loggerMock.info).toHaveBeenLastCalledWith(
                    `Received EmailAddressDeletedEvent, personId:${event.personId}, username:${event.username}, address:${event.address}`,
                );
                expect(ldapClientServiceMock.removeMailAlternativeAddress).toHaveBeenCalledTimes(1);
                expect(eventServiceMock.publish).toHaveBeenCalledWith(
                    expect.objectContaining({
                        personId: personId,
                        username: username,
                        address: address,
                    }),
                    expect.objectContaining({
                        personId: personId,
                        username: username,
                        address: address,
                    }),
                );
            });
        });
    });

    describe('handleEmailAddressesPurgedEvent', () => {
        const personId: PersonID = faker.string.uuid();
        const username: PersonReferrer = faker.internet.userName();

        it('should log error when username is UNDEFINED in event', async () => {
            const event: EmailAddressesPurgedEvent = new EmailAddressesPurgedEvent(
                personId,
                undefined,
                faker.string.numeric(),
            );
            await ldapEventHandler.handleEmailAddressesPurgedEvent(event);

            expect(loggerMock.info).toHaveBeenCalledWith(
                `Received EmailAddressesPurgedEvent, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
            );
            expect(loggerMock.info).toHaveBeenLastCalledWith(
                `Cannot delete lehrer by username, username is UNDEFINED, oxUserId:${event.oxUserId}`,
            );
            expect(ldapClientServiceMock.deleteLehrerByUsername).toHaveBeenCalledTimes(0);
            expect(eventServiceMock.publish).toHaveBeenCalledTimes(0);
        });

        it('should call LdapClientService deleteLehrerByReferrer', async () => {
            const event: EmailAddressesPurgedEvent = new EmailAddressesPurgedEvent(
                personId,
                username,
                faker.string.numeric(),
            );
            ldapClientServiceMock.deleteLehrerByUsername.mockResolvedValueOnce({
                ok: true,
                value: personId,
            });
            await ldapEventHandler.handleEmailAddressesPurgedEvent(event);

            expect(loggerMock.info).toHaveBeenLastCalledWith(
                `Received EmailAddressesPurgedEvent, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
            );
            expect(ldapClientServiceMock.deleteLehrerByUsername).toHaveBeenCalledTimes(1);
            expect(eventServiceMock.publish).toHaveBeenCalledWith(
                expect.objectContaining({
                    personId: personId,
                    username: username,
                }),
                expect.objectContaining({
                    personId: personId,
                    username: username,
                }),
            );
        });

        it('should call LdapClientService deleteLehrerByReferrer and log error if result is NOT ok', async () => {
            const error: LdapSearchError = new LdapSearchError(LdapEntityType.LEHRER);
            const event: EmailAddressesPurgedEvent = new EmailAddressesPurgedEvent(
                personId,
                username,
                faker.string.numeric(),
            );
            ldapClientServiceMock.deleteLehrerByUsername.mockResolvedValueOnce({
                ok: false,
                error: error,
            });
            await ldapEventHandler.handleEmailAddressesPurgedEvent(event);

            expect(loggerMock.info).toHaveBeenLastCalledWith(
                `Received EmailAddressesPurgedEvent, personId:${event.personId}, username:${event.username}, oxUserId:${event.oxUserId}`,
            );
            expect(ldapClientServiceMock.deleteLehrerByUsername).toHaveBeenCalledTimes(1);
            expect(loggerMock.error).toHaveBeenLastCalledWith(error.message);
            expect(eventServiceMock.publish).toHaveBeenCalledTimes(0);
        });
    });
});
