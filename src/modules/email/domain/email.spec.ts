import { Test, TestingModule } from '@nestjs/testing';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { EmailGeneratorService } from './email-generator.service.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailFactory } from './email.factory.js';
import { Email } from './email.js';
import { faker } from '@faker-js/faker';
import { Person } from '../../person/domain/person.js';
import { EmailInvalidError } from '../error/email-invalid.error.js';
import { EmailAddress } from './email-address.js';
import { EmailID } from '../../../shared/types/index.js';

describe('Email Aggregate', () => {
    let module: TestingModule;
    let emailFactory: EmailFactory;
    let emailGeneratorServiceMock: DeepMocked<EmailGeneratorService>;
    let personRepositoryMock: DeepMocked<PersonRepository>;
    let email: Email<false>;

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
        email = emailFactory.createNew(faker.string.uuid());
    });

    describe('enable', () => {
        describe('when emailAddresses are already present on aggregate', () => {
            it('should return successfully', async () => {
                const emailId: EmailID = faker.string.uuid();
                const emailAddresses: EmailAddress<true>[] = [
                    new EmailAddress<true>(emailId, faker.internet.email(), false),
                ];
                const existingEmail: Email<true> = emailFactory.construct(
                    emailId,
                    faker.date.past(),
                    faker.date.recent(),
                    faker.string.uuid(),
                    emailAddresses,
                );

                const result: Result<Email<true>> = await existingEmail.enable();

                expect(result.ok).toBeTruthy();
            });
        });

        describe('when person cannot be found', () => {
            it('should return EmailInvalidError', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(undefined);

                const result: Result<Email<false>> = await email.enable();

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
                const result: Result<Email<false>> = await email.enable();

                expect(result.ok).toBeFalsy();
            });
        });
    });

    describe('disable', () => {
        describe('when no emailAddresses exist', () => {
            it('should return false', () => {
                const result: boolean = email.disable();
                expect(result).toBeFalsy();
            });
        });

        describe('when emailAddresses exist', () => {
            it('should set all of them to disabled return true ', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(createMock<Person<true>>());
                emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                    ok: true,
                    value: faker.internet.email(),
                });
                const enabledEmail: Result<Email<false>> = await email.enable();

                if (!enabledEmail.ok) throw new Error();
                const result: boolean = enabledEmail.value.disable();
                expect(result).toBeTruthy();
                const emailAddresses: EmailAddress<false>[] | undefined = enabledEmail.value.emailAddresses;
                if (!emailAddresses) throw new Error();
                expect(emailAddresses.every((ea: EmailAddress<false>) => !ea.enabled));
            });
        });
    });

    describe('isEnabled', () => {
        describe('when no emailAddresses exist', () => {
            it('should return false', () => {
                expect(email.isEnabled()).toBeFalsy();
            });
        });

        describe('when emailAddresses exist and at least one is enabled', () => {
            it('should return true ', async () => {
                personRepositoryMock.findById.mockResolvedValueOnce(createMock<Person<true>>());
                emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                    ok: true,
                    value: faker.internet.email(),
                });
                const enabledEmail: Result<Email<false>> = await email.enable();

                if (!enabledEmail.ok) throw new Error();
                expect(enabledEmail.value.isEnabled()).toBeTruthy();
            });
        });
    });

    describe('get currentAddress', () => {
        let fakeEmailAddress: string;

        beforeEach(() => {
            email = emailFactory.createNew(faker.string.uuid());
            fakeEmailAddress = faker.internet.email();
            personRepositoryMock.findById.mockResolvedValueOnce(createMock<Person<true>>());
            emailGeneratorServiceMock.generateAddress.mockResolvedValueOnce({
                ok: true,
                value: fakeEmailAddress,
            });
        });

        describe('when no emailAddresses exist', () => {
            it('should return undefined', () => {
                expect(email.currentAddress).toBeUndefined();
            });
        });

        describe('when emailAddresses exist and at least one is enabled', () => {
            it('should return the emailAddress-address string', async () => {
                const enabledEmail: Result<Email<false>> = await email.enable();

                if (!enabledEmail.ok) throw new Error();
                expect(enabledEmail.value.currentAddress).toStrictEqual(fakeEmailAddress);
            });
        });

        describe('when emailAddresses exist but none is enabled', () => {
            it('should return undefined', async () => {
                const enabledEmail: Result<Email<false>> = await email.enable();

                if (!enabledEmail.ok) throw new Error();
                enabledEmail.value.disable();

                expect(enabledEmail.value.currentAddress).toBeUndefined();
            });
        });
    });
});
