import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import {
    ConfigTestModule,
    DatabaseTestModule,
    DEFAULT_TIMEOUT_FOR_TESTCONTAINERS,
} from '../../../../test/utils/index.js';
import { EmailRepo } from './email.repo.js';
import { EmailFactory } from '../domain/email.factory.js';
import { createMock } from '@golevelup/ts-jest';
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
import { Email } from '../domain/email.js';
import { MikroORM } from '@mikro-orm/core';

describe('EmailRepo', () => {
    let module: TestingModule;
    let sut: EmailRepo;
    let emailFactory: EmailFactory;
    let personFactory: PersonFactory;
    let personRepository: PersonRepository;
    let orm: MikroORM;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [ConfigTestModule, DatabaseTestModule.forRoot({ isDatabaseRequired: true })],
            providers: [
                UsernameGeneratorService,
                EmailRepo,
                EmailFactory,
                PersonFactory,
                PersonRepository,
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
            ],
        }).compile();
        sut = module.get(EmailRepo);
        emailFactory = module.get(EmailFactory);
        personFactory = module.get(PersonFactory);
        personRepository = module.get(PersonRepository);
        orm = module.get(MikroORM);

        await DatabaseTestModule.setupDatabase(orm);
    }, DEFAULT_TIMEOUT_FOR_TESTCONTAINERS);

    async function createPerson(): Promise<Person<true>> {
        const personResult: Person<false> | DomainError = await personFactory.createNew({
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
            username: faker.internet.userName(),
            password: faker.string.alphanumeric(8),
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

    describe('findByPerson', () => {
        describe('when email-address is found for personId', () => {
            it('should return email with email-addresses by personId', async () => {
                const person: Person<true> = await createPerson();
                const email: Result<Email> = await emailFactory.createNew(person.id);
                if (!email.ok) throw new Error();

                email.value.enable();
                const savedEmail: Email | DomainError = await sut.save(email.value);
                if (savedEmail instanceof DomainError) throw new Error();
                const foundEmail: Option<Email> = await sut.findByPerson(person.id);
                if (!foundEmail) throw Error();

                expect(foundEmail.emailAddress).toBeTruthy();
            });
        });

        describe('when person does NOT exist', () => {
            it('should return undefined', async () => {
                const foundEmail: Option<Email> = await sut.findByPerson(faker.string.uuid());

                expect(foundEmail).toBeUndefined();
            });
        });
    });

    describe('deactivateEmailAddress', () => {
        describe('when email-address exists', () => {
            it('should disable it and return EmailAddressEntity', async () => {
                const person: Person<true> = await createPerson();
                const email: Result<Email> = await emailFactory.createNew(person.id);
                if (!email.ok) throw new Error();
                email.value.enable();

                const savedEmail: Email | DomainError = await sut.save(email.value);
                if (savedEmail instanceof DomainError) throw new Error();
                const currentAddress: Option<string> = savedEmail.currentAddress;
                if (!currentAddress) throw new Error();
                const deactivationResult: EmailAddressEntity | EmailAddressNotFoundError =
                    await sut.deactivateEmailAddress(currentAddress);

                expect(deactivationResult).toBeInstanceOf(EmailAddressEntity);
            });
        });

        describe('when email-address does NOT exist', () => {
            it('should return EmailAddressNotFoundError', async () => {
                const person: Person<true> = await createPerson();
                const email: Result<Email> = await emailFactory.createNew(person.id);
                if (!email.ok) throw Error();
                email.value.enable();
                const savedEmail: Email | DomainError = await sut.save(email.value);
                if (savedEmail instanceof DomainError) throw new Error();
                const deactivationResult: EmailAddressEntity | EmailAddressNotFoundError =
                    await sut.deactivateEmailAddress(faker.internet.email());

                expect(deactivationResult).toBeInstanceOf(EmailAddressNotFoundError);
            });
        });
    });

    describe('save', () => {
        describe('when address is already persisted', () => {
            it('should use update method and return email aggregate', async () => {
                const person: Person<true> = await createPerson();
                const email: Result<Email> = await emailFactory.createNew(person.id);
                if (!email.ok) throw Error();
                email.value.enable();
                const persistedValidEmail: Email | DomainError = await sut.save(email.value);
                if (persistedValidEmail instanceof DomainError) throw new Error();

                persistedValidEmail.disable();
                const persistedDisabledEmail: Email | DomainError = await sut.save(persistedValidEmail);

                expect(persistedDisabledEmail).toBeInstanceOf(Email);
            });
        });

        describe('when address is already persisted BUT cannot be found in DB', () => {
            it('should return EmailAddressNotFoundError', async () => {
                const person: Person<true> = await createPerson();
                const email: Result<Email> = await emailFactory.createNew(person.id);
                if (!email.ok) throw Error();
                email.value.enable();

                const persistedValidEmail: Email | DomainError = await sut.save(email.value);
                if (persistedValidEmail instanceof DomainError) throw new Error();
                if (!persistedValidEmail.emailAddress) throw new Error();

                persistedValidEmail.emailAddress.address = faker.internet.email();

                const persistedChangedEmail: Email | DomainError = await sut.save(persistedValidEmail);

                expect(persistedChangedEmail).toBeInstanceOf(EmailAddressNotFoundError);
            });
        });
    });

    describe('findEmailAddressByPerson', () => {
        describe('when email for personId is found', () => {
            it('should return current address', async () => {
                const person: Person<true> = await createPerson();
                const email: Result<Email> = await emailFactory.createNew(person.id);
                if (!email.ok) throw Error();

                email.value.enable();

                const savedEmail: Email | DomainError = await sut.save(email.value);
                if (savedEmail instanceof DomainError) throw new Error();
                const currentAddress: Option<string> = savedEmail.currentAddress;
                if (!currentAddress) throw new Error();

                expect(await sut.findEmailAddressByPerson(person.id)).toStrictEqual(currentAddress);
            });
        });

        describe('when email for personId is NOT found', () => {
            it('should return undefined', async () => {
                const person: Person<true> = await createPerson();
                const email: Result<Email> = await emailFactory.createNew(person.id);
                if (!email.ok) throw Error();
                email.value.enable();
                const savedEmail: Email | DomainError = await sut.save(email.value);
                if (savedEmail instanceof DomainError) throw new Error();

                expect(await sut.findEmailAddressByPerson(faker.string.uuid())).toBeFalsy();
            });
        });

        describe('when email for personId is found, but email is disabled', () => {
            it('should return', async () => {
                const person: Person<true> = await createPerson();
                const email: Result<Email> = await emailFactory.createNew(person.id);
                if (!email.ok) throw Error();
                email.value.enable();
                email.value.disable();
                const savedEmail: Email | DomainError = await sut.save(email.value);
                if (savedEmail instanceof DomainError) throw new Error();

                expect(await sut.findEmailAddressByPerson(person.id)).toBeFalsy();
            });
        });
    });
});
