import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { EmailGeneratorService } from './email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailFactory } from './email.factory.js';
import { Email, EmailAddressProperties } from './email.js';
import { faker } from '@faker-js/faker';
import { Person } from '../../person/domain/person.js';
import { EmailInvalidError } from '../error/email-invalid.error.js';
import { EmailAddress } from './email-address.js';

describe('Email Aggregate', () => {
    let module: TestingModule;
    let emailFactory: EmailFactory;
    let emailGeneratorServiceMock: DeepMocked<EmailGeneratorService>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let newEmail: Email<false>;
    let firstEmailAddress: EmailAddress<true>;
    let emailAddresses: EmailAddress<true>[];
    let existingEmail: Email<true>;
    let newNames: EmailAddressProperties;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                EmailFactory,
                {
                    provide: EmailGeneratorService,
                    useValue: createMock<EmailGeneratorService>(),
                },
                {
                    provide: PersonRepository,
                    useValue: createMock<PersonRepository>(),
                },
            ],
        }).compile();
        emailGeneratorServiceMock = module.get(EmailGeneratorService);
        personRepositoryMock = module.get(PersonRepository);
        emailFactory = module.get(EmailFactory);
    });

    afterAll(async () => {
        await module.close();
    });

    beforeEach(() => {
        jest.resetAllMocks();
        newEmail = emailFactory.createNew(faker.string.uuid());
        firstEmailAddress = new EmailAddress<true>(faker.string.uuid(), faker.internet.email(), false);
        emailAddresses = [firstEmailAddress];
        existingEmail = emailFactory.construct(
            faker.string.uuid(),
            faker.date.past(),
            faker.date.recent(),
            faker.string.uuid(),
            emailAddresses,
        );
        newNames = {
            vorname: faker.person.firstName(),
            familienname: faker.person.lastName(),
        };
    });

    describe('enable', () => {
        describe('when emailAddresses are already present on aggregate', () => {
            it('should return successfully', async () => {
                const result: Result<Email<true>> = await existingEmail.enable();

                expect(result.ok).toBeTruthy();
            });
        });

        describe('when emailAddresses are undefined', () => {
            it('should return successfully', async () => {
                personRepositoryMock.findById.mockResolvedValue(createMock<Person<true>>());
                emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                    ok: true,
                    value: faker.internet.email(),
                });
                const result: Result<Email<false>> = await newEmail.enable();

                expect(result.ok).toBeTruthy();
            });
        });

        describe('when person cannot be found', () => {
            it('should return EmailInvalidError', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(undefined);

                const result: Result<Email<false>> = await newEmail.enable();

                expect(result.ok).toBeFalsy();
            });
        });

        describe('when generation of address fails', () => {
            it('should return EmailInvalidError', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(createMock<Person<true>>());
                emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                    ok: false,
                    error: new EmailInvalidError(),
                });
                const result: Result<Email<false>> = await newEmail.enable();

                expect(result.ok).toBeFalsy();
            });
        });
    });

    describe('disable', () => {
        describe('when no emailAddresses exist', () => {
            it('should return false', () => {
                const result: boolean = newEmail.disable();
                expect(result).toBeFalsy();
            });
        });

        describe('when emailAddresses exist', () => {
            it('should set all of them to disabled return true ', () => {
                const result: boolean = existingEmail.disable();

                expect(result).toBeTruthy();
                expect(firstEmailAddress.enabled).toBeFalsy();
            });
        });
    });

    describe('changeAddress', () => {
        describe('when person cannot be found', () => {
            it('should return EmailInvalidError', async () => {
                personRepositoryMock.findById.mockResolvedValue(createMock<Person<true>>());
                emailGeneratorServiceMock.isEqual.mockResolvedValueOnce(true);

                const result: Result<Email<true>> = await existingEmail.enable();

                if (!result.ok) throw new Error();
                personRepositoryMock.findById.mockResolvedValueOnce(undefined); //mock that no person is found in createNewAddress
                const changeAddressResult: Result<Email<true>> = await result.value.changeAddress(newNames);
                if (changeAddressResult.ok) throw new Error();
                expect(changeAddressResult.error).toBeInstanceOf(EmailInvalidError);
            });
        });

        describe('when generation of new (changed) address fails', () => {
            it('should return EmailInvalidError', async () => {
                emailGeneratorServiceMock.isEqual.mockResolvedValueOnce(true);
                personRepositoryMock.findById.mockResolvedValue(createMock<Person<true>>());

                const result: Result<Email<true>> = await existingEmail.enable();

                if (!result.ok) throw new Error();
                emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                    ok: false,
                    error: new EmailInvalidError(),
                });
                const changeAddressResult: Result<Email<true>> = await result.value.changeAddress(newNames);
                if (changeAddressResult.ok) throw new Error();
                expect(changeAddressResult.error).toBeInstanceOf(EmailInvalidError);
            });
        });

        describe('when email already contains other addresses', () => {
            it('should concat existing and new addresses', async () => {
                emailGeneratorServiceMock.isEqual.mockResolvedValueOnce(true);
                personRepositoryMock.findById.mockResolvedValue(createMock<Person<true>>());

                const result: Result<Email<true>> = await existingEmail.enable();

                if (!result.ok) throw new Error();
                emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                    ok: true,
                    value: faker.internet.email(),
                });
                const changeAddressResult: Result<Email<true>> = await result.value.changeAddress(newNames);
                if (!changeAddressResult.ok) throw new Error();
                expect(changeAddressResult.value.emailAddresses).toHaveLength(2);
            });
        });
    });

    describe('isEnabled', () => {
        describe('when no emailAddresses exist', () => {
            it('should return false', () => {
                expect(newEmail.isEnabled()).toBeFalsy();
            });
        });

        describe('when emailAddresses exist and at least one is enabled', () => {
            it('should return true ', () => {
                const emailAddress: EmailAddress<true> = new EmailAddress<true>(
                    faker.string.uuid(),
                    faker.internet.email(),
                    true,
                );
                const email: Email<true> = emailFactory.construct(
                    faker.string.uuid(),
                    faker.date.past(),
                    faker.date.recent(),
                    faker.string.uuid(),
                    [emailAddress],
                );
                const result: boolean = email.isEnabled();

                expect(result).toBeTruthy();
            });
        });
    });

    describe('get currentAddress', () => {
        describe('when no emailAddresses exist', () => {
            it('should return undefined', () => {
                expect(newEmail.currentAddress).toBeUndefined();
            });
        });

        describe('when emailAddresses exist and at least one is enabled', () => {
            it('should return the emailAddress-address string', () => {
                const emailAddress: EmailAddress<true> = new EmailAddress<true>(
                    faker.string.uuid(),
                    faker.internet.email(),
                    true,
                );
                const email: Email<true> = emailFactory.construct(
                    faker.string.uuid(),
                    faker.date.past(),
                    faker.date.recent(),
                    faker.string.uuid(),
                    [emailAddress],
                );
                const result: Option<string> = email.currentAddress;

                expect(result).toBeDefined();
            });
        });

        describe('when emailAddresses exist but none is enabled', () => {
            it('should return undefined', () => {
                const result: Option<string> = existingEmail.currentAddress;

                expect(result).toBeUndefined();
            });
        });
    });
});
