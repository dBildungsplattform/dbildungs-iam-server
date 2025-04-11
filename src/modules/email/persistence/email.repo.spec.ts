import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
    DoFactory,
} from '../../../../test/utils/index.js';
import { EmailRepo, mapAggregateToData } from './email.repo.js';
import { EmailFactory } from '../domain/email.factory.js';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { UsernameGeneratorService } from '../../person/domain/username-generator.service.js';
import { KeycloakUserService } from '../../keycloak-administration/index.js';
import { EventService } from '../../../core/eventbus/index.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailAddressNotFoundError } from '../error/email-address-not-found.error.js';
import { EmailAddressEntity } from './email-address.entity.js';
import { Person } from '../../person/domain/person.js';
import { DomainError } from '../../../shared/error/index.js';
import { EntityManager, MikroORM, NotFoundError, RequiredEntityData } from '@mikro-orm/core';
import { EmailAddress, EmailAddressStatus } from '../domain/email-address.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { PersonAlreadyHasEnabledEmailAddressError } from '../error/person-already-has-enabled-email-address.error.js';
import { UserLockRepository } from '../../keycloak-administration/repository/user-lock.repository.js';
import { PersonEmailResponse } from '../../person/api/person-email-response.js';
import { generatePassword } from '../../../shared/util/password-generator.js';
import { OxUserBlacklistRepo } from '../../person/persistence/ox-user-blacklist.repo.js';
import { OrganisationID, PersonID } from '../../../shared/types/aggregate-ids.types.js';
import assert from 'assert';
import { EmailAddressDeletionError } from '../error/email-address-deletion.error.js';

describe('EmailRepo', () => {
    let module: TestingModule;
    let sut: EmailRepo;
    let emailFactory: EmailFactory;
    let personFactory: PersonFactory;
    let personRepository: PersonRepository;
    let organisationRepository: OrganisationRepository;
    let orm: MikroORM;
    let em: EntityManager;

    let loggerMock: DeepMocked<ClassLogger>;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [
                UsernameGeneratorService,
                OxUserBlacklistRepo,
                EmailRepo,
                EmailFactory,
                PersonFactory,
                PersonRepository,
                OrganisationRepository,
                {
                    provide: EventService,
                    useValue: createMock<EventService>(),
                },
                {
                    provide: ClassLogger,
                    useValue: createMock<ClassLogger>(),
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
                {
                    provide: UserLockRepository,
                    useValue: createMock<UserLockRepository>(),
                },
            ],
        }).compile();
        sut = module.get(EmailRepo);
        emailFactory = module.get(EmailFactory);
        personFactory = module.get(PersonFactory);
        personRepository = module.get(PersonRepository);
        organisationRepository = module.get(OrganisationRepository);
        orm = module.get(MikroORM);
        em = module.get(EntityManager);

        loggerMock = module.get(ClassLogger);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

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
        const person: Person<true> | DomainError = await personRepository.create(personResult);
        if (person instanceof DomainError) {
            throw person;
        }

        return person;
    }

    async function createOrganisation(): Promise<Organisation<true>> {
        const parent: Organisation<false> = DoFactory.createOrganisation(false, {
            emailDomain: 'fake@schule-sh.de',
        });
        const parentPersisted: Organisation<true> = await organisationRepository.save(parent);
        const organisation: Organisation<false> = DoFactory.createOrganisation(false, {
            administriertVon: parentPersisted.id,
            emailDomain: 'fake@fake-schule.de',
        });
        return organisationRepository.save(organisation);
    }

    async function createEmailAddress(
        status: EmailAddressStatus,
        personId: PersonID,
        organisationId: OrganisationID,
    ): Promise<EmailAddress<true>> {
        const email: Result<EmailAddress<false>> = await emailFactory.createNew(personId, organisationId);
        if (!email.ok) throw new Error();

        switch (status) {
            case EmailAddressStatus.ENABLED:
                email.value.enable();
                break;
            case EmailAddressStatus.REQUESTED:
                email.value.request();
                break;
        }
        const savedEmail: EmailAddress<true> | DomainError = await sut.save(email.value);
        assert(!(savedEmail instanceof DomainError));

        return savedEmail;
    }

    async function createPersonAndOrganisationAndEmailAddress(
        status: EmailAddressStatus,
    ): Promise<[Person<true>, Organisation<true>, EmailAddress<true>]> {
        const person: Person<true> = await createPerson();
        const organisation: Organisation<true> = await createOrganisation();
        const email: EmailAddress<true> = await createEmailAddress(status, person.id, organisation.id);

        return [person, organisation, email];
    }

    /**
     * Creates an EmailAddress directly via EntityManager instead of the EmailRepo
     * to allow for creation of invalid objects such as the second EmailAddress with ENABLED status for a person.
     * @param status
     * @param personId
     * @param address
     */
    async function createEmailAddressViaEM(
        status: EmailAddressStatus,
        personId: PersonID,
        address: string = faker.internet.email(),
        updatedAt?: Date,
    ): Promise<string> {
        const entityData: RequiredEntityData<EmailAddressEntity> = {
            status: status,
            address: address,
            personId: personId,
            id: faker.string.uuid(),
            oxUserId: '0',
            updatedAt: updatedAt ?? faker.date.future(),
        };
        const emailAddressEntity: EmailAddressEntity = em.create(EmailAddressEntity, entityData);
        await em.persistAndFlush(emailAddressEntity);

        return emailAddressEntity.id;
    }

    afterAll(async () => {
        await orm.close();
        await module.close();
    });

    beforeEach(async () => {
        await DatabaseTestModule.clearDatabase(orm);
    });

    it('should be defined', () => {
        expect(sut).toBeDefined();
    });

    describe('findEnabledByPerson', () => {
        describe('when email-address is found for personId', () => {
            it('should return email with email-addresses by personId', async () => {
                const [person, ,]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                    await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.ENABLED);

                const foundEmail: Option<EmailAddress<true>> = await sut.findEnabledByPerson(person.id);
                if (!foundEmail) throw Error();

                expect(foundEmail).toBeTruthy();
            });
        });

        describe('when person does NOT exist', () => {
            it('should return undefined', async () => {
                const foundEmail: Option<EmailAddress<true>> = await sut.findEnabledByPerson(faker.string.uuid());

                expect(foundEmail).toBeUndefined();
            });
        });
    });

    describe('findRequestedByPerson', () => {
        describe('when email-address is found for personId', () => {
            it('should return emailAddress by personId', async () => {
                const [person, ,]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                    await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.REQUESTED);

                const foundEmail: Option<EmailAddress<true>> = await sut.findRequestedByPerson(person.id);
                if (!foundEmail) throw Error();

                expect(foundEmail).toBeTruthy();
            });
        });

        describe('when multiple email-addresses are found for personId', () => {
            it('should return most recently updated emailAddress by personId and log warning', async () => {
                const [person, organisation]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                    await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.REQUESTED);
                const newerEmailAddress: EmailAddress<true> = await createEmailAddress(
                    EmailAddressStatus.REQUESTED,
                    person.id,
                    organisation.id,
                );

                const foundEmail: Option<EmailAddress<true>> = await sut.findRequestedByPerson(person.id);
                if (!foundEmail) throw Error();

                expect(loggerMock.warning).toHaveBeenCalledWith(
                    `Multiple EmailAddresses Found In REQUESTED Status For personId:${person.id}, Will Only Return address:${newerEmailAddress.address}`,
                );

                expect(foundEmail.address).toStrictEqual(newerEmailAddress.address);
            });
        });

        describe('when person does NOT exist', () => {
            it('should return null', async () => {
                const foundEmail: Option<EmailAddress<true>> = await sut.findRequestedByPerson(faker.string.uuid());

                expect(foundEmail).toBeNull();
            });
        });
    });

    describe('findByPerson', () => {
        describe('when no status is provided and email-address is found for personId', () => {
            it('should return email with email-addresses by personId', async () => {
                const [person, ,]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                    await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.REQUESTED);

                const foundEmails: Option<EmailAddress<true>[]> = await sut.findByPersonSortedByUpdatedAtDesc(
                    person.id,
                );
                if (!foundEmails) throw Error();

                expect(foundEmails).toBeTruthy();
                expect(foundEmails).toHaveLength(1);
            });
        });

        describe('when no status is provided and person does NOT exist', () => {
            it('should return empty array', async () => {
                const foundEmails: Option<EmailAddress<true>[]> = await sut.findByPersonSortedByUpdatedAtDesc(
                    faker.string.uuid(),
                );

                expect(foundEmails).toEqual([]);
            });
        });

        describe('when ENABLED status is provided but only requested email-address is found for personId', () => {
            it('should return empty array', async () => {
                const [person, ,]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                    await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.REQUESTED);

                const foundEmails: Option<EmailAddress<true>[]> = await sut.findByPersonSortedByUpdatedAtDesc(
                    person.id,
                    EmailAddressStatus.ENABLED,
                );

                expect(foundEmails).toEqual([]);
            });
        });

        describe('when ENABLED status is provided and email-address is found for personId', () => {
            it('should return undefined', async () => {
                const [person, ,]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                    await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.ENABLED);

                const foundEmails: Option<EmailAddress<true>[]> = await sut.findByPersonSortedByUpdatedAtDesc(
                    person.id,
                    EmailAddressStatus.ENABLED,
                );
                if (!foundEmails) throw Error();

                expect(foundEmails).toBeDefined();
                expect(foundEmails).toHaveLength(1);
            });
        });

        describe('when status is provided and person does NOT exist', () => {
            it('should return empty array', async () => {
                const foundEmails: Option<EmailAddress<true>[]> = await sut.findByPersonSortedByUpdatedAtDesc(
                    faker.string.uuid(),
                    EmailAddressStatus.ENABLED,
                );

                expect(foundEmails).toEqual([]);
            });
        });
    });

    describe('getEmailAddressAndStatusForPerson', () => {
        describe('when person has NO email-address assigned', () => {
            it('should return undefined', async () => {
                const person: Person<true> = await createPerson();

                const personEmailResponse: Option<PersonEmailResponse> =
                    await sut.getEmailAddressAndStatusForPerson(person);

                expect(personEmailResponse).toBeUndefined();
            });
        });

        describe('when person has enabled email-address assigned', () => {
            it('should return enabled address', async () => {
                const [person, organisation]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                    await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.REQUESTED);

                const emailEnabled: Result<EmailAddress<false>> = await emailFactory.createNew(
                    person.id,
                    organisation.id,
                );
                if (!emailEnabled.ok) throw new Error();
                emailEnabled.value.enable();
                const savedEnabledEmail: EmailAddress<true> | DomainError = await sut.save(emailEnabled.value);
                if (savedEnabledEmail instanceof DomainError) throw new Error();

                const personEmailResponse: Option<PersonEmailResponse> =
                    await sut.getEmailAddressAndStatusForPerson(person);

                if (!personEmailResponse) throw Error();

                expect(personEmailResponse.status).toStrictEqual(EmailAddressStatus.ENABLED);
                expect(personEmailResponse.address).toStrictEqual(emailEnabled.value.address);
            });
        });

        describe('when person has no enabled email-address assigned', () => {
            it('should return the most recently updated one', async () => {
                const [person, organisation]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                    await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.REQUESTED);

                const emailFailed: Result<EmailAddress<false>> = await emailFactory.createNew(
                    person.id,
                    organisation.id,
                );
                if (!emailFailed.ok) throw new Error();
                emailFailed.value.failed();
                const savedFailedEmail: EmailAddress<true> | DomainError = await sut.save(emailFailed.value);
                if (savedFailedEmail instanceof DomainError) throw new Error();

                const personEmailResponse: Option<PersonEmailResponse> =
                    await sut.getEmailAddressAndStatusForPerson(person);

                if (!personEmailResponse) throw Error();

                expect(personEmailResponse.status).toStrictEqual(EmailAddressStatus.FAILED);
                expect(personEmailResponse.address).toStrictEqual(emailFailed.value.address);
            });
        });
    });

    describe('getEmailAddressAndStatusForPersonIds', () => {
        async function createPersonsOrgasEmailAddresses(): Promise<[PersonID[], EmailAddress<true>]> {
            const [person1, , ea1]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.ENABLED);
            const [person2]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.REQUESTED);
            const [person3]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.DISABLED);
            const personIds: PersonID[] = [person1.id, person2.id, person3.id];

            return [personIds, ea1];
        }

        describe('when EmailAddresses with other status than ENABLED are found', () => {
            it('should result only containing ENABLED EmailAddresses', async () => {
                const [personIds, emailAddress1]: [PersonID[], EmailAddress<true>] =
                    await createPersonsOrgasEmailAddresses();
                const personId1: PersonID | undefined = personIds[0];
                assert(personId1);

                const responseMap: Map<PersonID, PersonEmailResponse> =
                    await sut.getEmailAddressAndStatusForPersonIds(personIds);

                expect(responseMap.size).toStrictEqual(1);
                expect(responseMap.get(personId1)?.address).toStrictEqual(emailAddress1.address);
            });
        });

        describe('when for (one) personId NO ENABLED EmailAddress can be found', () => {
            it('should return map with PersonEmailResponses for the other personIds', async () => {
                const personIdWithoutEnabledAddress: PersonID = faker.string.uuid();
                const [personIds, emailAddress1]: [PersonID[], EmailAddress<true>] =
                    await createPersonsOrgasEmailAddresses();
                const personId1: PersonID | undefined = personIds[0];
                assert(personId1);

                const extendedPersonIds: PersonID[] = personIds;
                extendedPersonIds.push(personIdWithoutEnabledAddress);

                const responseMap: Map<PersonID, PersonEmailResponse> =
                    await sut.getEmailAddressAndStatusForPersonIds(extendedPersonIds);

                expect(responseMap.size).toStrictEqual(1);
                expect(responseMap.get(personId1)?.address).toStrictEqual(emailAddress1.address);
                expect(responseMap.get(personIdWithoutEnabledAddress)).toBeUndefined();
            });
        });

        describe('when for (one) personId multiple EmailAddresses are found', () => {
            it('should sort, return map with PersonEmailResponses containing most recent address and log error', async () => {
                const [personIds, emailAddress1]: [PersonID[], EmailAddress<true>] =
                    await createPersonsOrgasEmailAddresses();
                const personId1: PersonID | undefined = personIds[0];
                assert(personId1);

                const moreRecentAddress: string = faker.internet.email();
                await createEmailAddressViaEM(EmailAddressStatus.ENABLED, personId1, moreRecentAddress);

                const responseMap: Map<PersonID, PersonEmailResponse> =
                    await sut.getEmailAddressAndStatusForPersonIds(personIds);

                expect(loggerMock.error).toHaveBeenCalledWith(
                    `Found multiple ENABLED EmailAddresses, treating ${moreRecentAddress} as latest address, personId:${personId1}`,
                );
                expect(responseMap.size).toStrictEqual(1);
                expect(responseMap.get(personId1)?.address).toStrictEqual(moreRecentAddress);
                expect(responseMap.get(personId1)?.address).not.toStrictEqual(emailAddress1.address);
            });
        });
    });

    describe('findByAddress', () => {
        describe('when emailAddress CANNOT be found via address', () => {
            it('should throw error', async () => {
                const emailAddress: Option<EmailAddress<true>> = await sut.findByAddress(faker.internet.email());
                expect(emailAddress).toBeUndefined();
            });
        });

        describe('when emailAddress can be found via address', () => {
            it('should return emailAddress aggregate', async () => {
                const [, , savedRequestedEmail]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                    await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.REQUESTED);

                const emailAddress: Option<EmailAddress<true>> = await sut.findByAddress(savedRequestedEmail.address);
                if (!emailAddress) throw new Error();

                expect(emailAddress.address).toStrictEqual(savedRequestedEmail.address);
            });
        });
    });

    describe('getEmailAddressesDeleteList', () => {
        describe('when some exceeded and some non-exceeded EmailAddresses exist', () => {
            it('should return only EmailAddresses which exceed the deadline', async () => {
                const person: Person<true> = await createPerson();
                const address1: string = faker.internet.email();
                const address2: string = faker.internet.email();
                const address3: string = faker.internet.email();
                const address4: string = faker.internet.email();
                const address5: string = faker.internet.email();
                const address6: string = faker.internet.email();

                const today: Date = new Date();
                const dateInPast: Date = new Date();
                dateInPast.setDate(dateInPast.getDate() - 180);

                await createEmailAddressViaEM(EmailAddressStatus.REQUESTED, person.id, address1, dateInPast);
                await createEmailAddressViaEM(EmailAddressStatus.FAILED, person.id, address2, dateInPast);
                await createEmailAddressViaEM(EmailAddressStatus.DISABLED, person.id, address3, dateInPast);

                await createEmailAddressViaEM(EmailAddressStatus.REQUESTED, person.id, address4, today);
                await createEmailAddressViaEM(EmailAddressStatus.FAILED, person.id, address5, today);
                await createEmailAddressViaEM(EmailAddressStatus.DISABLED, person.id, address6, today);

                const deleteList: EmailAddress<true>[] = await sut.getEmailAddressesDeleteList();

                expect(deleteList).toHaveLength(3);
                expect(deleteList).toContainEqual(
                    expect.objectContaining({
                        address: address1,
                    }),
                );
                expect(deleteList).toContainEqual(
                    expect.objectContaining({
                        address: address2,
                    }),
                );
                expect(deleteList).toContainEqual(
                    expect.objectContaining({
                        address: address3,
                    }),
                );
            });
        });
    });

    describe('deactivateEmailAddress', () => {
        describe('when email-address exists', () => {
            it('should disable it and return EmailAddressEntity', async () => {
                const [, , savedEmail]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                    await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.ENABLED);

                const currentAddress: Option<string> = savedEmail.currentAddress;
                if (!currentAddress) throw new Error();
                const deactivationResult: EmailAddressEntity | EmailAddressNotFoundError =
                    await sut.deactivateEmailAddress(currentAddress);

                expect(deactivationResult).toBeInstanceOf(EmailAddressEntity);
            });
        });

        describe('when email-address does NOT exist', () => {
            it('should return EmailAddressNotFoundError', async () => {
                const deactivationResult: EmailAddressEntity | EmailAddressNotFoundError =
                    await sut.deactivateEmailAddress(faker.internet.email());

                expect(deactivationResult).toBeInstanceOf(EmailAddressNotFoundError);
            });
        });
    });

    describe('save', () => {
        describe('when address is already persisted', () => {
            it('should use update method and return EmailAddress aggregate', async () => {
                const [, , persistedValidEmail]: [Person<true>, Organisation<true>, EmailAddress<true>] =
                    await createPersonAndOrganisationAndEmailAddress(EmailAddressStatus.ENABLED);

                persistedValidEmail.disable();
                const persistedDisabledEmail: EmailAddress<true> | DomainError = await sut.save(persistedValidEmail);

                expect(persistedDisabledEmail).toBeInstanceOf(EmailAddress);
            });
        });

        describe('when address is already persisted BUT cannot be found in DB', () => {
            it('should return EmailAddressNotFoundError', async () => {
                const person: Person<true> = await createPerson();
                const emailAddress: EmailAddress<true> = emailFactory.construct(
                    faker.string.uuid(),
                    faker.date.past(),
                    faker.date.recent(),
                    person.id,
                    faker.internet.email(),
                    EmailAddressStatus.ENABLED,
                );

                const persistenceResult: EmailAddress<true> | DomainError = await sut.save(emailAddress);

                expect(persistenceResult).toBeInstanceOf(EmailAddressNotFoundError);
            });
        });

        describe('when address with status ENABLED is already present for person', () => {
            it('should return PersonAlreadyHasEnabledEmailAddressError', async () => {
                const person: Person<true> = await createPerson();
                const organisation: Organisation<true> = await createOrganisation();
                const email: Result<EmailAddress<false>> = await emailFactory.createNew(person.id, organisation.id);
                if (!email.ok) throw Error();
                email.value.enable();
                const persistedValidEmail: EmailAddress<true> | DomainError = await sut.save(email.value);
                if (persistedValidEmail instanceof DomainError) throw new Error();

                const person2: Person<true> = await createPerson();
                const email2: Result<EmailAddress<false>> = await emailFactory.createNew(person2.id, organisation.id);
                if (!email2.ok) throw Error();
                email2.value.enable();
                const persistedValidEmail2: EmailAddress<true> | DomainError = await sut.save(email.value);

                const error: PersonAlreadyHasEnabledEmailAddressError = new PersonAlreadyHasEnabledEmailAddressError(
                    person.id,
                    email.value.address,
                );
                expect(persistedValidEmail2).toEqual(error);
            });
        });
    });

    describe('deleteById', () => {
        describe('when EmailAddress with specified id exists', () => {
            it('should delete EmailAddress in DB and return undefined', async () => {
                const person: Person<true> = await createPerson();
                const address1: string = faker.internet.email();
                const today: Date = new Date();
                const address1Id: string = await createEmailAddressViaEM(
                    EmailAddressStatus.REQUESTED,
                    person.id,
                    address1,
                    today,
                );

                const deletionResult1: Option<DomainError> = await sut.deleteById(address1Id);
                const emailAddress: Option<EmailAddress<true>> = await sut.findByAddress(address1);
                expect(deletionResult1).toBeUndefined();
                expect(emailAddress).toBeUndefined();
            });
        });

        describe('when EmailAddress with specified id does NOT exist', () => {
            it('should return Error', async () => {
                const address2Id: string = faker.string.uuid();
                const notFoundError: NotFoundError = new NotFoundError(
                    `EmailAddressEntity not found ({ id: '${address2Id}' })`,
                );
                const deletionResult2: Option<DomainError> = await sut.deleteById(address2Id);

                expect(deletionResult2).toBeInstanceOf(EmailAddressDeletionError);
                expect(loggerMock.logUnknownAsError).toHaveBeenCalledWith(
                    'Error during deletion of EmailAddress',
                    notFoundError,
                );
            });
        });
    });

    describe('mapAggregateToData', () => {
        const expectedProperties: string[] = ['id', 'personId', 'address', 'oxUserId', 'status'];

        describe('when oxUserId is provided', () => {
            it('should return EmailAddress RequiredEntityData', () => {
                const person: EmailAddress<true> = EmailAddress.construct(
                    faker.string.uuid(),
                    faker.date.past(),
                    faker.date.recent(),
                    faker.string.uuid(),
                    faker.internet.email(),
                    faker.helpers.enumValue(EmailAddressStatus),
                    faker.string.numeric(),
                );

                const result: RequiredEntityData<EmailAddressEntity> = mapAggregateToData(person);

                expectedProperties.forEach((prop: string) => {
                    expect(result).toHaveProperty(prop);
                });
            });
        });

        describe('when oxUserId is NOT provided', () => {
            it('should return EmailAddress RequiredEntityData', () => {
                const person: EmailAddress<true> = EmailAddress.construct(
                    faker.string.uuid(),
                    faker.date.past(),
                    faker.date.recent(),
                    faker.string.uuid(),
                    faker.internet.email(),
                    faker.helpers.enumValue(EmailAddressStatus),
                );

                const result: RequiredEntityData<EmailAddressEntity> = mapAggregateToData(person);

                expectedProperties.forEach((prop: string) => {
                    expect(result).toHaveProperty(prop);
                });
            });
        });
    });
});
